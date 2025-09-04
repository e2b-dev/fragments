import { z } from 'zod'

// Schema for morph edit instructions
export const morphEditSchema = z.object({
  commentary: z.string().describe('Explain what changes you are making and why'),
  instruction: z.string().describe('One line instruction on what the change is'),
  edit: z.string().describe(
    'You should make it clear what the edit is, while also minimizing the unchanged code you write. When writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines. For example: // ... existing code ... FIRST_EDIT // ... existing code ... SECOND_EDIT // ... existing code ... THIRD_EDIT // ... existing code ... Be Lazy when outputting code, rely heavily on the exisitng code comments, but each edit should contain minimally sufficient context of unchanged lines around the code you\'re editing to resolve ambiguity. DO NOT omit spans of pre-existing code (or comments) without using the // ... existing code ... comment to indicate its absence. If you omit the existing code comment, the model may inadvertently delete these lines. If you plan on deleting a section, you must provide context before and after to delete it. If the initial code is ```code \\n Block 1 \\n Block 2 \\n Block 3 \\n code```, and you want to remove Block 2, you would output ```// ... existing code ... \\n Block 1 \\n  Block 3 \\n // ... existing code ...```. '
  ),
  file_path: z.string().describe('Path to the file being edited'),
})

export type MorphEditSchema = z.infer<typeof morphEditSchema>
