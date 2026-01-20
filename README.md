# AI Book Writer - Professional Edition

Made by Professor UPSC - A powerful AI-powered note-taking and content generation application.

## 🚀 Features

- **AI-Powered Content Generation**: Generate comprehensive study guides from topics or format raw notes
- **Multi-Language Support**: Hindi, English, and Hinglish
- **Rich Text Editor**: Professional editing with undo/redo, font sizing, and more
- **AI Rewrite Tools**: 
  - Rewrite sections
  - Expand content with deep dive
  - Continue writing
  - Generate next topics
  - Create illustrations
  - Generate comparison tables
- **PDF Export**: Export your notes as professionally formatted PDFs
- **Auto-Save**: Never lose your work with automatic saving
- **Responsive Design**: Works on desktop and mobile

## 📁 Project Structure

```
src/
├── components/
│   ├── Editor/
│   │   ├── EditorCanvas.tsx      # Main editor area
│   │   ├── EditorToolbar.tsx     # Top toolbar with controls
│   │   └── RewriteModal.tsx      # AI rewrite modal
│   ├── Sidebar/
│   │   └── Sidebar.tsx           # Input sidebar
│   └── ui/
│       └── Button.tsx            # Reusable button component
├── hooks/
│   ├── useEditor.ts              # Editor logic & utilities
│   └── useHistory.ts             # Undo/Redo history management
├── services/
│   └── ai.ts                     # AI generation functions (Gemini API)
├── types/
│   └── index.ts                  # TypeScript types & enums
├── utils/
│   ├── pdf.ts                    # PDF export utility
│   └── storage.ts                # LocalStorage utilities
├── App.tsx                       # Main app component
├── index.css                     # Global styles
└── main.tsx                      # Entry point
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Gemini AI** - Content generation
- **Lucide React** - Icons

## 📦 Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd Notesmakeruppsc
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server
```bash
npm run dev
```

## 🌐 Deployment

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🔑 Getting Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it in your `.env.local` file

## 📝 Usage

### Generate Content from Topic
1. Select "Topic" mode in sidebar
2. Enter your topic (e.g., "History of India")
3. Choose language (Hindi/English/Hinglish)
4. Click "Generate Magic Chapter"

### Format Raw Notes
1. Select "Text" mode in sidebar
2. Paste your raw notes
3. Choose language
4. Click "Format Notes Perfectly"

### Edit & Enhance
1. Click "Edit" button in toolbar
2. Click ✨ icon on any section to:
   - Rewrite content
   - Expand with more details
   - Continue writing
   - Generate next topic
   - Add illustrations
   - Create comparison tables

### Export to PDF
1. Click "Export PDF" button
2. Print dialog will open
3. Save as PDF

## 🎨 Customization

### Adding New Features

The modular structure makes it easy to add features:

1. **New Components**: Add to `src/components/`
2. **New Hooks**: Add to `src/hooks/`
3. **New AI Functions**: Add to `src/services/ai.ts`
4. **New Types**: Add to `src/types/index.ts`
5. **New Utilities**: Add to `src/utils/`

### Example: Adding a New AI Feature

```typescript
// 1. Add function to src/services/ai.ts
export const generateSummary = async (content: string): Promise<string> => {
  const ai = createAIClient();
  const prompt = `Summarize: ${content}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return cleanHtmlOutput(response.text || "");
};

// 2. Add type to src/types/index.ts
export type EditTab = 'rewrite' | 'expand' | 'continue' | 'next_topic' | 'image' | 'table' | 'summary';

// 3. Use in component
const handleSummary = async () => {
  const summary = await generateSummary(selectedText);
  // Handle summary
};
```

## 🐛 Troubleshooting

### API Key Issues
- Make sure your `.env.local` file has `VITE_` prefix
- Restart dev server after changing env variables

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Made with ❤️ by Professor UPSC

---

**Note**: This application uses Google's Gemini AI API. Make sure you comply with Google's terms of service and usage policies.
