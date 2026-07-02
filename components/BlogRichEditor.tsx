'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useCallback } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Quote, Code2, Link2, ImageIcon, AlignLeft,
  AlignCenter, AlignRight
} from 'lucide-react'

interface BlogRichEditorProps {
  content: string
  onChange: (_html: string) => void
  placeholder?: string
}

const ToolBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2.5 py-2.5 min-h-[44px] min-w-[44px] rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
      active
        ? 'bg-[#8D6E53] text-white border-[#8D6E53]'
        : 'bg-white text-stone-700 border-[#EADDCD]/60 hover:bg-[#8D6E53] hover:text-white'
    }`}
  >
    {children}
  </button>
)

export default function BlogRichEditor({ content, onChange, placeholder }: BlogRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      ImageExtension.configure({ inline: false }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Nhập nội dung bài viết...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none min-h-[350px] p-5 text-xs leading-relaxed',
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Nhập URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Nhập URL ảnh:')
    if (!url) return
    const alt = window.prompt('Mô tả ảnh (Alt Text) — hỗ trợ SEO:', '')
    editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="border-2 border-[#EADDCD] rounded-3xl overflow-hidden bg-[#FAF6F0]">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAF6F0]/95 border-b-2 border-[#EADDCD] sticky top-[75px] md:top-[83px] z-30 shadow-sm">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="In đậm"><Bold className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="In nghiêng"><Italic className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Gạch chân"><UnderlineIcon className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block align-middle" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Tiêu đề H2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Tiêu đề H3"><Heading3 className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block align-middle" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách"><List className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block align-middle" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn"><Quote className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code"><Code2 className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block align-middle" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Căn trái"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Căn giữa"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Căn phải"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block align-middle" />
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Chèn link"><Link2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={addImage} title="Chèn ảnh"><ImageIcon className="w-3.5 h-3.5" /></ToolBtn>
      </div>
      <EditorContent editor={editor} className="bg-white" />
    </div>
  )
}
