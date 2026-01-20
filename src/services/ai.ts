import { GoogleGenAI } from '@google/genai';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('Environment check:', {
  hasImportMeta: typeof import.meta !== 'undefined',
  hasEnv: typeof import.meta.env !== 'undefined',
  allEnvKeys: import.meta.env ? Object.keys(import.meta.env) : [],
  apiKeyPresent: !!API_KEY,
  apiKeyLength: API_KEY?.length || 0
});

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY not found in environment variables');
  console.error('Available env vars:', import.meta.env);
  throw new Error('API key is missing. Please check your .env.local file and restart the dev server.');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Model selection helper
const getModel = (modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash') => {
  if (modelType === 'gemini-3-pro') {
    return 'gemini-3-pro-preview';
  }
  return 'gemini-3-flash-preview';
};

const cleanHtmlOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

export const generateTopicContent = async (
  topic: string,
  language: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    console.log('Starting generation for topic:', topic);
    console.log('Using model:', getModel(modelType));
    
    const prompt = `Role: Academic Textbook Author.

Task: Write a HIGH-DENSITY, EXHAUSTIVE chapter.

Topic: "${topic}"
Language: ${language}

**STRICT NUMBERING & STRUCTURE RULES:**
Use strict hierarchical numbering for ALL headings.
- <h1>1. [Main Title]</h1>
- <h2>1.1 [Major Section]</h2>
- <h3>1.1.1 [Sub-Section]</h3>

**CONTENT REQUIREMENTS:**
1. **Density:** More facts, fewer filler words.
2. **Depth:** Every sub-section must contain substantial academic value.
3. **Key Concepts:** Wrap vital definitions in: <div class="key-point"><strong>Key Concept:</strong> ...text...</div>
4. **Tables:** Use HTML tables with <thead> for complex data.

**Output:** Return ONLY raw HTML.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    console.log('API Response received');
    
    if (!response.text) {
      console.error('No text in response. Full response:', JSON.stringify(response, null, 2));
      throw new Error('No text content in API response');
    }
    
    return cleanHtmlOutput(response.text);
  } catch (error: any) {
    console.error('Error generating topic content:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    if (error?.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local');
    }
    
    if (error?.message?.includes('model')) {
      throw new Error('Model not found. The model may not be available.');
    }
    
    throw error;
  }
};

export const generateFormattedNotes = async (
  rawText: string,
  language: string
): Promise<string> => {
  try {
    const prompt = `Role: Professional Editor.

Task: Format notes into a dense, numbered textbook format.

Input Text: ${rawText}
Language: ${language}

**RULES:**
1. **Structure:** Strict tree (1. -> 1.1 -> 1.1.1).
2. **Density:** Remove conversational filler. Make it concise but complete.
3. **Formatting:** Use <div class="key-point"> and <div class="note-box">.

**Output:** Return ONLY raw HTML.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error formatting notes:', error);
    throw error;
  }
};

export const rewriteContent = async (
  textToRewrite: string,
  instruction: string
): Promise<string> => {
  try {
    const prompt = `Role: Expert Editor.

Task: Rewrite the selected text efficiently.

Input: "${textToRewrite}"
User Instruction: ${instruction}

**Rules:**
- Maintain strict hierarchical numbering if present.
- Make the text DENSE and ACADEMIC.
- Do not lose sub-points.

Return ONLY the HTML.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error rewriting content:', error);
    return textToRewrite;
  }
};

export const rewriteSection = async (
  sectionContent: string,
  instruction: string
): Promise<string> => {
  try {
    const prompt = `Role: Senior Editor.

Task: Rewrite the HTML section based on instruction.

Input HTML: ${sectionContent}
Instruction: "${instruction}"

**CRITICAL:** 
1. PRESERVE HIERARCHY: Keep exact numbering structure.
2. Maintain logical relationships.
3. Academic, high density tone.

Output: Valid HTML only.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error rewriting section:', error);
    throw error;
  }
};

export const expandSection = async (
  sectionContent: string,
  instruction: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    const prompt = `Role: Academic Researcher.

Task: DEEP DIVE & EXPAND the selected section.

Input HTML: ${sectionContent}
Instruction: "${instruction}"

**Requirements:**
1. **High Density:** Maximize information per page.
2. **Structure:** Explode bullet points into full sub-sections.
3. **Data:** Use tables for comparisons.
4. **Volume:** Increase depth of knowledge, not just word count.

Output: Valid HTML only.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error expanding section:', error);
    throw error;
  }
};

export const generateNextContent = async (
  previousContext: string,
  instruction: string
): Promise<string> => {
  try {
    const prompt = `Role: Expert Co-Author.

Task: Continue the document seamlessly.

**Context:** ${previousContext}
**User Request:** "${instruction}"

**Rules:**
1. Start where previous context ended.
2. Follow user's exact request.
3. Smart numbering continuation.
4. High density, professional tone.

Output: HTML for NEW content only.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating next content:', error);
    throw error;
  }
};

export const generateDetailedNextTopic = async (
  previousContext: string,
  topicName: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    const prompt = `Role: Senior Professor & Textbook Author.

Task: Create comprehensive, structured notes for the topic.

**Previous Context:** ${previousContext}
**Target Topic:** "${topicName}"

**EXECUTION:**
1. **Format:** Structured Notes (Headings, Sub-headings, Bullet Points).
2. **Numbering:** Detect last number and continue logically.
3. **Depth:** Define clearly, break down, provide examples.
4. **Visual Aids:** Use <div class="key-point"> and <div class="note-box">.
5. **Density:** High information density, professional tone.

Output: HTML for new section only.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating detailed topic:', error);
    throw error;
  }
};

export const generateComplexTable = async (
  contextText: string,
  instruction: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    // Extract meaningful context from HTML
    const cleanContext = contextText
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // More context for better understanding

    const prompt = `You are a table creation expert. Create a comprehensive comparison table.

**Context from document:**
${cleanContext}

**User instruction:**
"${instruction}"

**CRITICAL RULES:**
1. Analyze the context carefully to understand the topic
2. Create a multi-column table (3-6 columns based on topic)
3. Include 5-15 rows with detailed information
4. Use <thead> with <th> for headers
5. Use <tbody> with <tr> and <td> for data
6. Use <strong> for important terms
7. Use bullet points (<ul><li>) inside cells if needed
8. Make it comprehensive and informative

**HTML Structure:**
<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Column 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
      <td>Data 3</td>
    </tr>
  </tbody>
</table>

**Output:** Return ONLY the <table> HTML. No explanations, no markdown.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating table:', error);
    throw error;
  }
};

export const generateSectionImage = async (
  contextText: string,
  instruction: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    console.log('🎨 Generating visual diagram with instruction:', instruction);
    console.log('📝 Context length:', contextText.length);
    
    // Extract better context - keep structure and all sub-points
    const cleanContext = contextText
      .replace(/<div class="ai-edit-trigger[^>]*>.*?<\/div>/gs, '')
      .replace(/<span class="ai-edit-trigger[^>]*>.*?<\/span>/gs, '')
      .replace(/<button[^>]*class="[^"]*ai-edit-trigger[^"]*"[^>]*>.*?<\/button>/gs, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('🧹 Cleaned context length:', cleanContext.length);

    // Detect diagram type from instruction
    const instructionLower = instruction.toLowerCase();
    
    // Check for specific diagram keywords (order matters - check more specific first!)
    const isMindmap = instructionLower.includes('mindmap') || instructionLower.includes('mind map');
    const isFlowchart = instructionLower.includes('flowchart') || instructionLower.includes('flow chart') || instructionLower.includes('process flow');
    const isTimeline = instructionLower.includes('timeline') || instructionLower.includes('chronology');
    const isTree = instructionLower.includes('tree') || instructionLower.includes('hierarchy');
    const isVenn = instructionLower.includes('venn') || instructionLower.includes('overlap');
    const isMatrix = instructionLower.includes('matrix') || instructionLower.includes('grid') || instructionLower.includes('comparison table');
    const isCircular = (instructionLower.includes('circular diagram') || instructionLower.includes('radial')) && !instructionLower.includes('cycle');
    const isBox = instructionLower.includes('box') || instructionLower.includes('square') || instructionLower.includes('rectangle');
    const isPyramid = instructionLower.includes('pyramid') || instructionLower.includes('triangle');
    const isFunnel = instructionLower.includes('funnel') || instructionLower.includes('conversion');
    const isSwot = instructionLower.includes('swot') || instructionLower.includes('strengths weaknesses');
    const isCycle = instructionLower.includes('cycle') && !instructionLower.includes('circular diagram');
    
    console.log('🔍 Diagram type detection:', {
      isMindmap, isFlowchart, isTimeline, isTree, isVenn, isMatrix,
      isCircular, isBox, isPyramid, isFunnel, isSwot, isCycle
    });
    
    // Prepare prompt based on diagram type
    let diagramPrompt = '';
    let diagramType = 'visual';
    
    if (isMindmap) {
      diagramType = 'mindmap';
      diagramPrompt = `Convert this content into a MINDMAP format using HTML.

Content to convert:
${cleanContext}

**CRITICAL INSTRUCTIONS:**
1. Analyze the content and identify the CENTRAL TOPIC
2. Create 3-6 MAIN BRANCHES from the central topic
3. Each branch should have 2-4 SUB-POINTS
4. Use this EXACT HTML structure:

<div class="diagram-container mindmap-diagram">
  <div class="diagram-title">🧠 Mind Map: [Topic Name]</div>
  <div class="mindmap-center">
    <div class="central-node">[Central Topic from content]</div>
    <div class="branch branch-1">
      <div class="node">[Main Branch 1]</div>
      <div class="sub-node">[Sub-point 1]</div>
      <div class="sub-node">[Sub-point 2]</div>
    </div>
    <div class="branch branch-2">
      <div class="node">[Main Branch 2]</div>
      <div class="sub-node">[Sub-point 1]</div>
      <div class="sub-node">[Sub-point 2]</div>
    </div>
    <!-- Add more branches as needed -->
  </div>
  <p class="diagram-caption">Visual representation of ${instruction}</p>
</div>

**RULES:**
- Extract actual content from the text provided
- Keep text concise (2-5 words per node)
- Use <strong> for important terms
- Return ONLY the HTML structure above with actual content`;

    } else if (isFlowchart) {
      diagramType = 'flowchart';
      diagramPrompt = `Convert this content into a FLOWCHART format using HTML.

Content to convert:
${cleanContext}

**CRITICAL INSTRUCTIONS:**
1. Identify the PROCESS or STEPS in the content
2. Create a logical flow from START to END
3. Include DECISION points if applicable
4. Use this EXACT HTML structure:

<div class="diagram-container flowchart-diagram">
  <div class="diagram-title">📊 Flowchart: [Process Name]</div>
  <div class="flow-step start">[Start Point]</div>
  <div class="flow-arrow">↓</div>
  <div class="flow-step process">[Step 1]</div>
  <div class="flow-arrow">↓</div>
  <div class="flow-step decision">[Decision Point?]</div>
  <div class="flow-branches">
    <div class="flow-branch">
      <div class="flow-arrow">Yes →</div>
      <div class="flow-step process">[Action A]</div>
    </div>
    <div class="flow-branch">
      <div class="flow-arrow">No →</div>
      <div class="flow-step process">[Action B]</div>
    </div>
  </div>
  <div class="flow-arrow">↓</div>
  <div class="flow-step end">[End Point]</div>
  <p class="diagram-caption">Process flow for ${instruction}</p>
</div>

**RULES:**
- Extract actual steps from the content
- Keep each step concise (3-8 words)
- Use decision points where applicable
- Return ONLY the HTML structure with actual content`;

    } else if (isTimeline) {
      diagramType = 'timeline';
      diagramPrompt = `Convert this content into a TIMELINE format using HTML.

Content to convert:
${cleanContext}

**CRITICAL INSTRUCTIONS:**
1. Identify CHRONOLOGICAL events or dates in the content
2. Create timeline entries with dates/years
3. Use this EXACT HTML structure:

<div class="diagram-container timeline-diagram">
  <div class="diagram-title">📅 Timeline: [Topic Name]</div>
  <div class="timeline-horizontal">
    <div class="timeline-event">
      <div class="timeline-date">[Year/Date 1]</div>
      <div class="timeline-dot"></div>
      <div class="timeline-content">[Event 1 description]</div>
    </div>
    <div class="timeline-line"></div>
    <div class="timeline-event">
      <div class="timeline-date">[Year/Date 2]</div>
      <div class="timeline-dot"></div>
      <div class="timeline-content">[Event 2 description]</div>
    </div>
    <!-- Add more events as needed -->
  </div>
  <p class="diagram-caption">Timeline of ${instruction}</p>
</div>

**RULES:**
- Extract actual dates/years from content
- Keep descriptions concise (5-10 words)
- Arrange chronologically
- Return ONLY the HTML structure with actual content`;

    } else if (isBox) {
      diagramType = 'box';
      diagramPrompt = `Convert this content into a BOX DIAGRAM format using HTML.

Content to convert:
${cleanContext}

**CRITICAL INSTRUCTIONS:**
1. Identify 4 MAIN CATEGORIES or aspects in the content
2. List key points under each category
3. Use this EXACT HTML structure:

<div class="diagram-container box-diagram">
  <div class="diagram-title">📦 Box Diagram: [Topic Name]</div>
  <div class="box-grid">
    <div class="box-item box-1">
      <div class="box-header">[Category 1]</div>
      <div class="box-content">
        <ul>
          <li>[Point A]</li>
          <li>[Point B]</li>
          <li>[Point C]</li>
        </ul>
      </div>
    </div>
    <div class="box-item box-2">
      <div class="box-header">[Category 2]</div>
      <div class="box-content">
        <ul>
          <li>[Point A]</li>
          <li>[Point B]</li>
        </ul>
      </div>
    </div>
    <!-- Add 2 more boxes -->
  </div>
  <p class="diagram-caption">Categorized view of ${instruction}</p>
</div>

**RULES:**
- Extract actual categories from content
- 2-4 points per box
- Keep points concise
- Return ONLY the HTML structure with actual content`;

    } else {
      // Default: Use AI to decide best format
      diagramPrompt = `Convert this content into a VISUAL DIAGRAM format using HTML.

Content to convert:
${cleanContext}

User instruction: "${instruction}"

**TASK:**
Analyze the content and choose the BEST visual format:
- If it has a central concept with branches → Use MINDMAP format
- If it shows a process or steps → Use FLOWCHART format
- If it has dates/chronology → Use TIMELINE format
- If it has categories → Use BOX DIAGRAM format

Then create the diagram using the appropriate HTML structure with proper CSS classes.

**RULES:**
- Extract actual content from the text
- Keep text concise and clear
- Use proper HTML structure with CSS classes
- Return ONLY the HTML diagram structure`;
    }

    console.log(`🎯 Generating ${diagramType} diagram using AI...`);

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: diagramPrompt,
    });
    
    const diagramHtml = cleanHtmlOutput(response.text);
    
    console.log('✅ Diagram HTML generated, length:', diagramHtml.length);
    return diagramHtml;
  } catch (error) {
    console.error('❌ Error generating diagram:', error);
    throw error;
  }
};


// ============ TABLE-ONLY MODE ============
export const generateTableOnly = async (
  topic: string,
  language: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    const prompt = `Role: Data Analyst & Table Expert.

Task: Create MULTIPLE COMPREHENSIVE COMPARISON TABLES for the topic.

Topic: "${topic}"
Language: ${language}

**CRITICAL REQUIREMENTS:**
1. **Multiple Tables:** Create AT LEAST 3-5 detailed comparison tables covering different aspects
2. **Each Table Structure:**
   - Clear heading (h2 or h3) BEFORE each table
   - Descriptive caption inside <caption> tag
   - Multiple columns (3-6 columns)
   - Multiple rows (minimum 5-10 rows per table)
3. **Content:** Include dates, facts, comparisons, key points, detailed information
4. **Formatting:** Use <strong> for important terms, bullet points in cells if needed

**EXAMPLE STRUCTURE:**
<h2>Table 1: [Aspect Name]</h2>
<table>
  <caption>[Description]</caption>
  <thead>
    <tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr>
  </thead>
  <tbody>
    <tr><td>Data 1</td><td>Data 2</td><td>Data 3</td></tr>
    <!-- More rows -->
  </tbody>
</table>

<h2>Table 2: [Another Aspect]</h2>
<table>
  <!-- Similar structure -->
</table>

**Output:** Return ONLY HTML with multiple tables (minimum 3 tables) and their headings.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating tables:', error);
    throw error;
  }
};

// ============ COMPACT TIMELINE MODE ============
export const generateCompactTimeline = async (
  topic: string,
  language: string
): Promise<string> => {
  try {
    const prompt = `Role: Timeline & Compact Notes Expert.

Task: Create ULTRA-COMPACT TIMELINE-STYLE NOTES with connected lines.

Topic: "${topic}"
Language: ${language}

**CRITICAL STRUCTURE:**
Use this EXACT HTML structure for timeline format:

<div class="timeline-container">
  <div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-content">
      <h3 class="timeline-heading">1.1 [Year/Event Name]</h3>
      <ul class="timeline-points">
        <li>Key point 1</li>
        <li>Key point 2</li>
        <li>Key point 3</li>
      </ul>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-content">
      <h3 class="timeline-heading">1.2 [Next Year/Event]</h3>
      <ul class="timeline-points">
        <li>Key point 1</li>
        <li>Key point 2</li>
      </ul>
    </div>
  </div>
</div>

**RULES:**
1. **Numbering:** Use 1.1, 1.2, 1.3... for chronological events
2. **Compact:** Maximum 3-5 bullet points per event
3. **Chronological:** Arrange in time order
4. **Connected:** Each timeline-item will be visually connected with lines (CSS handles this)

**Output:** Return ONLY the HTML structure above with your content.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating compact timeline:', error);
    throw error;
  }
};

export const generateFormattedNotesWithFormat = async (
  rawText: string,
  language: string,
  format: 'detailed-notes' | 'table-only' | 'compact-timeline'
): Promise<string> => {
  try {
    let prompt = '';
    
    if (format === 'table-only') {
      prompt = `Role: Table Formatting Expert.

Task: Convert the text into MULTIPLE COMPARISON TABLES.

Input Text: ${rawText}
Language: ${language}

**REQUIREMENTS:**
1. Extract all data and organize into 3-5 comprehensive tables
2. Each table should compare different aspects
3. Use proper headings, captions, and formatting

**Output:** Return ONLY HTML tables with headings.`;
    } else if (format === 'compact-timeline') {
      prompt = `Role: Timeline Formatter.

Task: Convert text into COMPACT TIMELINE format.

Input Text: ${rawText}
Language: ${language}

**Use this structure:**
<div class="timeline-container">
  <div class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-content">
      <h3 class="timeline-heading">1.1 [Event/Topic]</h3>
      <ul class="timeline-points">
        <li>Point 1</li>
        <li>Point 2</li>
      </ul>
    </div>
  </div>
</div>

**Output:** Return ONLY timeline HTML.`;
    } else {
      // Default detailed notes
      prompt = `Role: Professional Editor.

Task: Format notes into a dense, numbered textbook format.

Input Text: ${rawText}
Language: ${language}

**RULES:**
1. **Structure:** Strict tree (1. -> 1.1 -> 1.1.1).
2. **Density:** Remove conversational filler. Make it concise but complete.
3. **Formatting:** Use <div class="key-point"> and <div class="note-box">.

**Output:** Return ONLY raw HTML.`;
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error formatting notes:', error);
    throw error;
  }
};


// ============ INCREMENTAL TABLE BUILDER ============
export const generateIncrementalTable = async (
  instruction: string,
  language: string,
  existingTableHtml?: string
): Promise<string> => {
  try {
    let prompt = '';
    
    if (existingTableHtml) {
      // Add more rows to existing table
      prompt = `Role: Table Expansion Expert.

Task: ADD MORE ROWS to the existing table based on instruction.

Existing Table HTML:
${existingTableHtml}

New Instruction: "${instruction}"
Language: ${language}

**CRITICAL RULES:**
1. **Same Structure:** Use EXACT same columns as existing table
2. **Continue Numbering:** If table has rows 1-20, start from 21
3. **No Headings:** Return ONLY the table HTML, no h1/h2/h3
4. **Append Rows:** Add new <tr> rows to the existing table structure
5. **Consistency:** Match the style and format of existing rows

**Output:** Return the COMPLETE table HTML with old + new rows.`;
    } else {
      // Create new table
      prompt = `Role: Table Creation Expert.

Task: Create a SINGLE COMPARISON TABLE (no headings, just table).

Instruction: "${instruction}"
Language: ${language}

**REQUIREMENTS:**
1. **No Headings:** Do NOT include h1, h2, h3 tags - ONLY <table>
2. **Structure:** 
   - Use <thead> with <th> for column headers
   - Use <tbody> with <tr> and <td> for data rows
3. **Columns:** 3-6 columns based on the topic
4. **Rows:** Create comprehensive rows based on instruction
5. **Formatting:** Use <strong> for important terms, bullet points if needed

**Output:** Return ONLY the <table>...</table> HTML, nothing else.`;
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating incremental table:', error);
    throw error;
  }
};


// ============ TABLE CELL OPERATIONS ============
export const rewriteTableCell = async (
  cellContent: string,
  instruction: string,
  language: string
): Promise<string> => {
  try {
    const prompt = `Role: Table Cell Editor.

Task: Rewrite/improve the table cell content.

Current Content: "${cellContent}"
Instruction: "${instruction}"
Language: ${language}

**RULES:**
1. Keep it concise - suitable for table cell
2. Maintain factual accuracy
3. Use bullet points if multiple items
4. Use <strong> for key terms
5. Return ONLY the cell content (no <td> tags)

**Output:** Return the improved cell content as HTML.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error rewriting cell:', error);
    throw error;
  }
};

export const expandTableCell = async (
  cellContent: string,
  language: string
): Promise<string> => {
  try {
    const prompt = `Role: Table Cell Expander.

Task: Expand the table cell with more detailed information.

Current Content: "${cellContent}"
Language: ${language}

**RULES:**
1. Add more details, facts, or examples
2. Use bullet points for multiple items
3. Keep it organized and readable
4. Use <strong> for important terms
5. Return ONLY the cell content (no <td> tags)

**Output:** Return the expanded cell content as HTML.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error expanding cell:', error);
    throw error;
  }
};


// ============ STRUCTURED NOTES (Handwritten Style) ============
export const generateStructuredNotes = async (
  topic: string,
  language: string
): Promise<string> => {
  try {
    const prompt = `Role: Structured Notes Expert (Handwritten Style).

Task: Create HIGHLY STRUCTURED NOTES like handwritten study material.

Topic: "${topic}"
Language: ${language}

**EXACT STRUCTURE TO FOLLOW:**

<div class="structured-notes">
  <!-- Main Heading with Box -->
  <div class="main-heading-box">
    <h1>1. [Main Topic Title]</h1>
  </div>

  <!-- Section A -->
  <div class="section-block">
    <h2 class="section-letter">A. [Section Title]</h2>
    
    <!-- Sub-section with triangle -->
    <div class="subsection">
      <h3 class="triangle-heading">▲ [Subsection Title]:</h3>
      <ul class="bullet-list">
        <li>Point 1 with <strong>bold terms</strong></li>
        <li>Point 2 with details</li>
      </ul>
    </div>

    <!-- Numbered points -->
    <div class="numbered-section">
      <h4>1. [Numbered Heading]:</h4>
      <ul class="bullet-list">
        <li>Detail 1</li>
        <li>Detail 2</li>
      </ul>
    </div>
  </div>

  <!-- Section B -->
  <div class="section-block">
    <h2 class="section-letter">B. [Next Section]</h2>
    <!-- Similar structure -->
  </div>
</div>

**FORMATTING RULES:**
1. Use ▲ for important subsections
2. Use • for bullet points
3. Use <strong> for key terms, dates, names
4. Keep it compact and hierarchical
5. Use boxes for main headings
6. Letter sections (A, B, C...) for major divisions
7. Numbers (1, 2, 3...) for sub-points

**Output:** Return ONLY the HTML structure with content.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return cleanHtmlOutput(response.text);
  } catch (error) {
    console.error('Error generating structured notes:', error);
    throw error;
  }
};


// ============ TABLE COLUMN OPERATIONS ============
export const rewriteTableColumn = async (
  columnData: string[],
  columnHeader: string,
  language: string
): Promise<string[]> => {
  try {
    const prompt = `Role: Table Column Editor.

Task: Rewrite/improve the entire column data.

Column Header: "${columnHeader}"
Current Column Data:
${columnData.map((cell, i) => `Row ${i + 1}: ${cell}`).join('\n')}

Language: ${language}

**RULES:**
1. Maintain the same number of rows
2. Keep data relevant to column header
3. Improve clarity and detail
4. Use <strong> for key terms
5. Return one value per line

**Output:** Return improved values, one per line (same order as input).`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const result = cleanHtmlOutput(response.text);
    return result.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Error rewriting column:', error);
    throw error;
  }
};


// ============ PNG TABLE MODE (Single Table) ============
export const generateSingleTableForPNG = async (
  topic: string,
  language: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    const prompt = `Role: Table Creation Expert.

Task: Create ONE SINGLE COMPREHENSIVE HTML TABLE.

Topic: "${topic}"
Language: ${language}

**CRITICAL REQUIREMENTS:**
1. **Single Table Only:** Create ONLY ONE table
2. **No Headings:** Do NOT include h1, h2, h3 tags
3. **HTML Table Structure:** 
   <table>
     <thead>
       <tr>
         <th>Column 1</th>
         <th>Column 2</th>
         <th>Column 3</th>
       </tr>
     </thead>
     <tbody>
       <tr>
         <td>Data 1</td>
         <td>Data 2</td>
         <td>Data 3</td>
       </tr>
     </tbody>
   </table>

4. **Columns:** 3-6 columns based on topic
5. **Rows:** Minimum 10-15 data rows
6. **Content:** Detailed information with dates, facts, comparisons
7. **Formatting:** Use <strong> for key terms, <ul><li> for bullet points in cells

**IMPORTANT:** 
- Start directly with <table> tag
- End with </table> tag
- No text before or after table
- No markdown code blocks
- Pure HTML only

**Output:** Return ONLY the <table>...</table> HTML code.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    let result = cleanHtmlOutput(response.text);
    
    // Ensure it starts with <table> and ends with </table>
    if (!result.trim().startsWith('<table')) {
      const tableMatch = result.match(/<table[\s\S]*<\/table>/i);
      if (tableMatch) {
        result = tableMatch[0];
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating single table:', error);
    throw error;
  }
};


// ============ UPSC MAINS ANSWER WRITING ============
export const generateUPSCAnswer = async (
  question: string,
  subject: string,
  wordLimit: string,
  answerType: string,
  customInstruction: string,
  language: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    const answerTypePrompts: Record<string, string> = {
      'standard': 'Write a balanced answer with Introduction, Body (with multiple points), and Conclusion.',
      'analytical': 'Write an analytical answer focusing on cause-effect relationships, critical analysis, and evaluation.',
      'descriptive': 'Write a descriptive answer with detailed explanation, facts, figures, and comprehensive coverage.',
      'critical': 'Write a critical answer examining different viewpoints, pros-cons, and providing balanced judgment.'
    };

    const answerStyle = answerTypePrompts[answerType] || answerTypePrompts['standard'];
    
    // Word limit guidance
    let wordLimitText = '';
    if (wordLimit === '150') {
      wordLimitText = 'STRICT word limit: 150 words (Introduction: 2 lines, Body: 3-4 points, Conclusion: 2 lines)';
    } else if (wordLimit === '250') {
      wordLimitText = 'STRICT word limit: 250 words (Introduction: 3 lines, Body: 5-6 points, Conclusion: 3 lines)';
    } else if (wordLimit === '500') {
      wordLimitText = 'STRICT word limit: 500 words (Introduction: 1 paragraph, Body: 8-10 detailed points with sub-points, Conclusion: 1 paragraph)';
    } else {
      wordLimitText = 'Word limit: 200-250 words (flexible)';
    }

    const prompt = `You are a UPSC Mains answer writing expert. Write a high-quality answer for ${subject}.

Question: "${question}"
Language: ${language}
Answer Type: ${answerStyle}
${wordLimitText}
${customInstruction ? `Custom Instructions: ${customInstruction}` : ''}

Write answer in this EXACT format:

<div class="upsc-question">
<strong>Q.</strong> ${question} ${wordLimit !== 'none' ? `<span style="color: #f59e0b; font-weight: 600;">(${wordLimit} words)</span>` : ''}
</div>

<div class="upsc-answer">

<p><strong>Introduction:</strong> [Define key terms, provide context]</p>

<p><strong>Body:</strong></p>
<ul>
  <li><strong>Point 1:</strong> [Detailed explanation with facts/data]</li>
  <li><strong>Point 2:</strong> [Another dimension with examples]</li>
  <li><strong>Point 3:</strong> [Analysis with case studies]</li>
  ${wordLimit === '500' ? '<li><strong>Point 4-10:</strong> [More detailed points for 500 words]</li>' : ''}
</ul>

<p><strong>Conclusion:</strong> [Summarize and provide way forward]</p>

</div>

**CRITICAL RULES:**
- ${wordLimitText}
- ${answerStyle}
- Include facts, data, examples, government schemes with years
- Use <strong> for important terms
- Be precise and to the point
${customInstruction ? `- FOLLOW THIS: ${customInstruction}` : ''}

Return ONLY the HTML above. No markdown, no code blocks.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: prompt,
    });
    
    const answerHtml = cleanHtmlOutput(response.text);
    
    // Add separator after answer
    return answerHtml + '\n<hr style="margin: 40px 0; border: none; border-top: 2px dashed #cbd5e1;">\n';
  } catch (error) {
    console.error('Error generating UPSC answer:', error);
    throw error;
  }
};

// ============ FILE UPLOAD MODE (PDF/Image Processing) ============
export const generateFromFile = async (
  file: File,
  topicName: string,
  language: string,
  outputFormat: string,
  modelType: 'gemini-3-flash' | 'gemini-3-pro' = 'gemini-3-flash'
): Promise<string> => {
  try {
    console.log('Processing file:', file.name, 'Type:', file.type);
    
    // Convert file to base64
    const fileData = await fileToBase64(file);
    
    // Determine mime type
    let mimeType = file.type;
    if (!mimeType) {
      if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (file.name.endsWith('.png')) mimeType = 'image/png';
      else if (file.name.endsWith('.webp')) mimeType = 'image/webp';
    }

    const formatInstructions = getFormatInstructions(outputFormat);
    
    const prompt = `Role: Academic Content Analyzer & Formatter

Task: Extract and format content from the uploaded file.

Topic/Title: "${topicName}"
Language: ${language}
Output Format: ${outputFormat}

**INSTRUCTIONS:**
1. Carefully read and extract ALL text content from the file
2. Organize the content in a clear, structured format
3. ${formatInstructions}
4. Maintain academic quality and accuracy
5. Use proper HTML formatting with headings, paragraphs, lists, and tables

**STRICT NUMBERING & STRUCTURE:**
- <h1>1. [Main Title]</h1>
- <h2>1.1 [Section]</h2>
- <h3>1.1.1 [Sub-Section]</h3>

**Output:** Return ONLY raw HTML content.`;

    const response = await genAI.models.generateContent({
      model: getModel(modelType),
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: fileData
              }
            }
          ]
        }
      ]
    });

    console.log('File processing complete');
    
    if (!response.text) {
      throw new Error('No text content extracted from file');
    }
    
    return cleanHtmlOutput(response.text);
  } catch (error: any) {
    console.error('Error processing file:', error);
    
    if (error?.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY');
    }
    
    if (error?.message?.includes('file')) {
      throw new Error('Failed to process file. Please ensure it\'s a valid PDF or image.');
    }
    
    throw new Error('Failed to process file: ' + error.message);
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to get format-specific instructions
const getFormatInstructions = (format: string): string => {
  switch (format) {
    case 'detailed-notes':
      return 'Create comprehensive, detailed notes with all key concepts highlighted.';
    case 'structured-notes':
      return 'Format as structured notes with clear sections and bullet points.';
    case 'table-only':
      return 'Extract and organize information into well-structured HTML tables.';
    case 'compact-timeline':
      return 'Create a timeline format showing chronological progression.';
    case 'incremental-table':
      return 'Organize content into a comprehensive table format.';
    case 'png-table':
      return 'Create a single, well-formatted table with all key information.';
    default:
      return 'Format the content in a clear, organized manner.';
  }
};
