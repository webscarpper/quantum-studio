import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';

const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects, Vite is preferred.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates
  .map(
    (template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>
`,
  )
  .join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <title>{a proper title for the project}</title>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>react-basic-starter</templateName>
  <title>Simple React todo application</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>script to generate numbers from 1 to 100</title>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For more complex projects, recommend templates from the provided list
3. Follow the exact XML format
4. Consider both technical requirements and tags
5. If no perfect match exists, recommend the closest option

Important: Provide only the selection tags in your response, no additional text.
MOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH 
`;

const templates: Template[] = STARTER_TEMPLATES.filter((t) => !t.name.includes('shadcn'));

const parseSelectedTemplate = (llmOutput: string): { template: string; title: string } | null => {
  try {
    const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);
    const titleMatch = llmOutput.match(/<title>(.*?)<\/title>/);

    if (!templateNameMatch) {
      console.warn('Could not parse templateName from LLM output:', llmOutput);
      return null;
    }

    return { template: templateNameMatch[1].trim(), title: titleMatch?.[1].trim() || 'Untitled Project' };
  } catch (error) {
    console.error('Error parsing template selection XML:', error);
    return null;
  }
};

export const selectStarterTemplate = async (options: { message: string; model: string; provider: ProviderInfo }): Promise<{ template: string; title: string }> => {
  const { message, model, provider } = options;

  // If Deepseek is selected, or if provider/model is missing, skip LLM-based template selection
  if (!provider || !model || provider.name === 'Deepseek') {
    console.warn(`Skipping LLM-based starter template selection. Provider: ${provider?.name}, Model: ${model}. Defaulting to "blank".`);
    return {
      template: 'blank',
      title: message.substring(0, 50).trim() || 'New Project',
    };
  }

  const requestBody = {
    message,
    model,
    provider, // provider here is ProviderInfo, /api/llmcall expects { name: string } for provider
    system: starterTemplateSelectionPrompt(templates),
    streamOutput: false, // Ensure we get a non-streamed JSON response
  };

  let textOutput = '';
  try {
    const response = await fetch('/api/llmcall', {
      method: 'POST',
      body: JSON.stringify({
        ...requestBody,
        provider: { name: provider.name }, // Pass only necessary provider info
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorBody = `HTTP error ${response.status}`;
      let errorDetails: any = {}; // Initialize with a more flexible type or handle specific fields
      try {
        const errJson = await response.json() as { message?: string; error?: string; [key: string]: any };
        errorBody = errJson.message || errJson.error || response.statusText || errorBody;
        errorDetails = errJson; // Now errJson has a partial type
      } catch (e) {
        errorBody = response.statusText || errorBody;
      }
      console.error('Error fetching template selection from /api/llmcall:', errorBody, errorDetails);
      // Fallback to blank template on error
      return {
        template: 'blank',
        title: message.substring(0, 50).trim() || 'New Project',
      };
    }

    // Expecting a JSON response like { text: "...", ...other fields from GenerateTextResult }
    const respJson = await response.json() as { text?: string; [key: string]: any }; 
    
    if (typeof respJson.text !== 'string') {
        console.error('Invalid response format from /api/llmcall, missing text field:', respJson);
        return { template: 'blank', title: message.substring(0, 50).trim() || 'New Project' };
    }
    textOutput = respJson.text;
    console.log('LLM response for template selection:', textOutput);

  } catch (error) {
    console.error('Network or JSON parsing error in selectStarterTemplate:', error);
    // Fallback to blank template on error
    return {
      template: 'blank',
      title: message.substring(0, 50).trim() || 'New Project',
    };
  }

  const selectedTemplate = parseSelectedTemplate(textOutput);

  if (selectedTemplate) {
    return selectedTemplate;
  } else {
    console.log('No valid template selected by LLM, using blank template. LLM output was:', textOutput);
    return {
      template: 'blank',
      title: message.substring(0, 50).trim() || 'New Project', // Use part of message for title
    };
  }
};

const getGitHubRepoContent = async (repoName: string): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    const response = await fetch(`/api/github-template?repo=${encodeURIComponent(repoName)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const files = (await response.json()) as any; // Assuming API returns the expected array
    return files;
  } catch (error) {
    console.error('Error fetching release contents:', error);
    throw error; // Re-throw to be handled by caller
  }
};

export async function getTemplates(templateName: string, title?: string) {
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);
  if (!template) {
    console.error(`Template not found: ${templateName}`);
    return null;
  }

  const githubRepo = template.githubRepo;
  let files: { name: string; path: string; content: string }[] = [];
  try {
    files = await getGitHubRepoContent(githubRepo);
  } catch (error) {
    // If fetching repo content fails, return null or throw, so Chat.client.tsx can handle it
    console.error(`Failed to get GitHub repo content for ${githubRepo}:`, error);
    return null; 
  }


  let filteredFiles = files;
  filteredFiles = filteredFiles.filter((x) => !x.path.startsWith('.git'));
  filteredFiles = filteredFiles.filter((x) => !x.path.startsWith('.bolt'));

  const templateIgnoreFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'ignore');
  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  if (templateIgnoreFile) {
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim()).filter(p => p);
    if (ignorepatterns.length > 0) {
      const ig = ignore().add(ignorepatterns);
      const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));
      // filesToImport.files = filteredFiles.filter((x) => !ig.ignores(x.path)); // This was incorrect, should not filter main files list here
      filesToImport.ignoreFile = ignoredFiles;
    }
  }

  const assistantMessage = `
SIN is initializing your project with the required files using the ${template.name} template.
<boltArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>
`;
  let userMessage = ``;
  const templatePromptFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'prompt');

  if (templatePromptFile) {
    userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
  }

  if (filesToImport.ignoreFile.length > 0) {
    userMessage =
      userMessage +
      `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
  }

  userMessage += `
---
template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request

IMPORTANT: Dont Forget to install the dependencies before running the app by using \`npm install && npm run dev\`
`;

  return {
    assistantMessage,
    userMessage,
  };
}
