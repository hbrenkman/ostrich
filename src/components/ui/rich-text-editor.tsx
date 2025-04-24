import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, ImageIcon, AlignLeft, AlignCenter, AlignRight, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (content: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  // Create a custom extension for resizable images
  const ResizableImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          renderHTML: attributes => {
            if (!attributes.width) {
              return {};
            }
            return {
              width: attributes.width,
              style: `width: ${attributes.width}px`,
            };
          },
        },
        height: {
          default: null,
          renderHTML: attributes => {
            if (!attributes.height) {
              return {};
            }
            return {
              height: attributes.height,
              style: `height: ${attributes.height}px`,
            };
          },
        },
      };
    },
    addNodeView() {
      return ({ node, editor, getPos }) => {
        const dom = document.createElement('div');
        dom.classList.add('resize-image-wrapper');
        
        const img = document.createElement('img');
        img.src = node.attrs.src;
        img.alt = node.attrs.alt || '';
        if (node.attrs.width) {
          img.style.width = `${node.attrs.width}px`;
        }
        if (node.attrs.height) {
          img.style.height = `${node.attrs.height}px`;
        }
        dom.appendChild(img);
        
        // Add resize handles when selected
        const updateSize = (width: number, height: number) => {
          if (typeof getPos === 'function') {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(getPos(), undefined, {
                ...node.attrs,
                width,
                height,
              });
              return true;
            });
          }
        };
        
        // Create resize handles
        const createResizeHandles = () => {
          const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
          handles.forEach(position => {
            const handle = document.createElement('div');
            handle.classList.add('resize-handle', position);
            handle.addEventListener('mousedown', startResize);
            dom.appendChild(handle);
          });
          
          // Add size info element
          const sizeInfo = document.createElement('div');
          sizeInfo.classList.add('resize-info');
          sizeInfo.style.display = 'none';
          dom.appendChild(sizeInfo);
        };
        
        // Handle resize logic
        const startResize = (event: MouseEvent) => {
          event.preventDefault();
          
          const target = event.target as HTMLElement;
          const position = Array.from(target.classList).find(c => 
            ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(c)
          );
          
          if (!position) return;
          
          const startX = event.clientX;
          const startY = event.clientY;
          const startWidth = img.offsetWidth;
          const startHeight = img.offsetHeight;
          const aspectRatio = startWidth / startHeight;
          
          const sizeInfo = dom.querySelector('.resize-info') as HTMLElement;
          sizeInfo.style.display = 'block';
          sizeInfo.textContent = `${startWidth}×${startHeight}`;
          
          const onResize = (e: MouseEvent) => {
            e.preventDefault();
            
            let width = startWidth;
            let height = startHeight;
            
            // Calculate new dimensions based on drag position
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            if (position.includes('right')) {
              width = startWidth + deltaX;
            } else if (position.includes('left')) {
              width = startWidth - deltaX;
            }
            
            if (position.includes('bottom')) {
              height = startHeight + deltaY;
            } else if (position.includes('top')) {
              height = startHeight - deltaY;
            }
            
            // Maintain aspect ratio with shift key
            if (e.shiftKey) {
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                height = width / aspectRatio;
              } else {
                width = height * aspectRatio;
              }
            }
            
            // Ensure minimum size
            width = Math.max(30, width);
            height = Math.max(30, height);
            
            // Update image size
            img.style.width = `${width}px`;
            img.style.height = `${height}px`;
            
            // Update size info
            sizeInfo.textContent = `${Math.round(width)}×${Math.round(height)}`;
          };
          
          const stopResize = () => {
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
            
            // Hide size info after a delay
            setTimeout(() => {
              if (sizeInfo) sizeInfo.style.display = 'none';
            }, 1500);
            
            // Update the node attributes
            updateSize(img.offsetWidth, img.offsetHeight);
          };
          
          document.addEventListener('mousemove', onResize);
          document.addEventListener('mouseup', stopResize);
        };
        
        // Add selection handler
        editor.on('selectionUpdate', ({ editor }) => {
          const isSelected = editor.isActive('image', { src: node.attrs.src });
          if (isSelected) {
            dom.classList.add('ProseMirror-selectednode');
            if (!dom.querySelector('.resize-handle')) {
              createResizeHandles();
            }
          } else {
            dom.classList.remove('ProseMirror-selectednode');
            dom.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
            const sizeInfo = dom.querySelector('.resize-info');
            if (sizeInfo) sizeInfo.style.display = 'none';
          }
        });
        
        return {
          dom,
          update: (updatedNode) => {
            if (updatedNode.attrs.src !== node.attrs.src) {
              img.src = updatedNode.attrs.src;
            }
            if (updatedNode.attrs.width !== node.attrs.width) {
              img.style.width = updatedNode.attrs.width ? `${updatedNode.attrs.width}px` : '';
            }
            if (updatedNode.attrs.height !== node.attrs.height) {
              img.style.height = updatedNode.attrs.height ? `${updatedNode.attrs.height}px` : '';
            }
            return true;
          },
          destroy: () => {
            // Clean up event listeners if needed
          },
        };
      };
    },
  });

  const editor = useEditor({
    extensions: [
      ResizableImage.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2],
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      // Create an event-like object to match form input patterns
      onChange({ target: { value: editor.getHTML() } });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert focus:outline-none min-h-[150px] max-w-none p-4 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]',
        'data-placeholder': placeholder || 'Enter content...',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = React.memo(({ 
    isActive, 
    onClick, 
    icon: Icon,
    title
  }: { 
    isActive: boolean; 
    onClick: () => void; 
    icon: React.ElementType,
    title?: string
  }) => {
    return (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onClick(); // Execute the command
          editor?.commands.focus(); // Ensure editor keeps focus
        }}
        className={cn(
          "p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  });
  
  ToolbarButton.displayName = 'ToolbarButton';

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/5">
        <div className="flex items-center">
          <ToolbarButton
            isActive={editor.isActive('bold')}
            onClick={() => {
              editor.commands.toggleBold();
              editor.commands.focus();
            }}
            icon={Bold}
            title="Bold"
          />
          <ToolbarButton
            isActive={editor.isActive('italic')}
            onClick={() => {
              editor.commands.toggleItalic();
              editor.commands.focus();
            }}
            icon={Italic}
            title="Italic"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <div className="flex items-center">
          <ToolbarButton
            isActive={editor.isActive('bulletList')}
            onClick={() => {
              editor.commands.toggleBulletList();
              editor.commands.focus();
            }}
            icon={List}
            title="Bullet List"
          />
          <ToolbarButton
            isActive={editor.isActive('orderedList')}
            onClick={() => {
              editor.commands.toggleOrderedList();
              editor.commands.focus();
            }}
            icon={ListOrdered}
            title="Numbered List"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <div className="flex items-center">
          <ToolbarButton
            isActive={editor.isActive('heading', { level: 1 })}
            onClick={() => {
              editor.commands.toggleHeading({ level: 1 });
              editor.commands.focus();
            }}
            icon={Heading1}
            title="Heading 1"
          />
          <ToolbarButton
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => {
              editor.commands.toggleHeading({ level: 2 });
              editor.commands.focus();
            }}
            icon={Heading2}
            title="Heading 2"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <div className="flex items-center">
          <ToolbarButton
            isActive={false}
            onClick={() => {
              // Create a file input element
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/png,image/jpeg,image/gif,image/webp';
              
              // Handle file selection
              input.onchange = (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                  // Create a FileReader to read the image
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                      // Insert the image
                      editor.commands.setImage({ 
                        src: result,
                        alt: file.name || 'image',
                      });
                      editor.commands.focus();
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              
              // Trigger the file selection dialog
              input.click();
            }}
            icon={ImageIcon}
            title="Insert Image"
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'left' })}
            onClick={() => {
              editor.commands.setTextAlign('left');
              editor.commands.focus();
            }}
            icon={AlignLeft}
            title="Align Left"
          />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'center' })}
            onClick={() => {
              editor.commands.setTextAlign('center');
              editor.commands.focus();
            }}
            icon={AlignCenter}
            title="Align Center"
          />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'right' })}
            onClick={() => {
              editor.commands.setTextAlign('right');
              editor.commands.focus();
            }}
            icon={AlignRight}
            title="Align Right"
          />
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}