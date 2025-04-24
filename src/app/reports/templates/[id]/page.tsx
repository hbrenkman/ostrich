'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit2, Save, ChevronDown, ChevronRight, Move, Type, Palette, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportTemplate } from '@/modules/reports/frontend/hooks/useReportTemplate';
import type { ReportTemplateStyles } from '@/modules/reports/frontend/types';
import '@/styles/report-editor.css';
import '@/styles/layout.css';

const defaultStyles: ReportTemplateStyles = {
  textStyles: {
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      alignment: 'right'
    },
    sectionHeaders: {
      fontSize: '16px',
      fontWeight: 'semibold',
      color: '#1a1a1a',
      alignment: 'left'
    },
    normalText: {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#333333',
      alignment: 'left'
    },
    bodyText: {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#333333',
      alignment: 'left'
    },
    footerText: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#6b7280',
      alignment: 'center'
    }
  },
  lists: {
    bullet: {
      style: 'disc'
    },
    numbered: {
      style: 'decimal'
    },
    spacing: 8
  },
  header: {
    logo: {
      position: 'left',
      maxHeight: '60px'
    },
    companyName: 'Ostrich',
    companyAddress: '123 Business Street, Suite 100',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'contact@ostrich.com',
    companyWebsite: 'www.ostrich.com'
  },
  footer: {
    showPageNumbers: true,
    showProjectReference: true,
    showDate: true,
    customText: ''
  },
  styling: {
    fontFamily: 'sans-serif',
    background: '#FFFFFF',
    text: '#4A5A6B',
    accent: '#4DB6AC',
    margins: {
      top: '1in',
      bottom: '1in',
      left: '1in',
      right: '1in'
    }
  }
};

export default function ReportTemplateEditor() {
  const { template, setTemplate, loading, error, saveTemplate } = useReportTemplate();
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Default Template');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['textStyles', 'header', 'styling']));
  const [styles, setStyles] = useState<ReportTemplateStyles>(defaultStyles);

  const handlePanelClick = (panel: string) => {
    setSelectedPanel(selectedPanel === panel ? null : panel);
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(sectionKey)) {
        newCollapsed.delete(sectionKey);
      } else {
        newCollapsed.add(sectionKey);
      }
      return newCollapsed;
    });
  };

  const handleSave = async () => {
    try {
      await saveTemplate({
        name: templateName,
        type: template?.type || 'Custom',
        content: JSON.stringify(styles),
        isDefault: template?.isDefault || false
      });
      alert('Template saved successfully!');
    } catch (error) {
      alert('Failed to save template');
    }
  };

  if (loading) return <><div>Loading...</div></>;
  if (error) return <><div>Error loading template: {error.message}</div></>;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 bg-background border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/reports/templates"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-xl font-semibold bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 px-2 py-1 rounded"
                placeholder="Template Name"
              />
            </div>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>

        <div className="flex h-[calc(100vh-64px)]">
          {/* Settings Panel */}
          <div className="w-64 bg-background border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Panel Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => handlePanelClick('textStyles')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-foreground transition-colors ${
                    selectedPanel === 'textStyles' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/10'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Text Styles</span>
                </button>
                <button
                  onClick={() => handlePanelClick('lists')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-foreground transition-colors ${
                    selectedPanel === 'lists' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/10'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Lists & Formatting</span>
                </button>
                <button
                  onClick={() => handlePanelClick('header')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-foreground transition-colors ${
                    selectedPanel === 'header' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/10'
                  }`}
                >
                  <Move className="w-4 h-4" />
                  <span>Header & Footer</span>
                </button>
                <button
                  onClick={() => handlePanelClick('styling')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-foreground transition-colors ${
                    selectedPanel === 'styling' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/10'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Styling</span>
                </button>
              </div>

              {/* Lists & Formatting Panel */}
              <div className={`border-t mt-4 pt-4 ${selectedPanel === 'lists' ? '' : 'hidden'}`}>
                <div className="space-y-4 p-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Bullet Lists</h3>
                    <select
                      value={styles.lists?.bullet?.style || 'disc'}
                      onChange={(e) => setStyles(prev => ({
                        ...prev,
                        lists: {
                          ...prev.lists,
                          bullet: {
                            ...prev.lists?.bullet,
                            style: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="disc">Filled Circle</option>
                      <option value="circle">Empty Circle</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Numbered Lists</h3>
                    <select
                      value={styles.lists?.numbered?.style || 'decimal'}
                      onChange={(e) => setStyles(prev => ({
                        ...prev,
                        lists: {
                          ...prev.lists,
                          numbered: {
                            ...prev.lists?.numbered,
                            style: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="decimal">1, 2, 3</option>
                      <option value="lower-alpha">a, b, c</option>
                      <option value="upper-alpha">A, B, C</option>
                      <option value="lower-roman">i, ii, iii</option>
                      <option value="upper-roman">I, II, III</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">List Spacing</h3>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={styles.lists?.spacing || 8}
                      onChange={(e) => setStyles(prev => ({
                        ...prev,
                        lists: {
                          ...prev.lists,
                          spacing: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                    <span className="text-xs text-gray-500 mt-1">Spacing between list items (px)</span>
                  </div>
                </div>
              </div>

              {/* Text Styles Panel */}
              <div className={`border-t mt-4 pt-4 ${selectedPanel === 'textStyles' ? '' : 'hidden'}`}>
                <div className="space-y-4 p-4">
                  {Object.entries(styles.textStyles || {}).map(([key, style]) => (
                    <div key={key} className="space-y-2">
                      <h3 className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={style.fontSize}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            textStyles: {
                              ...prev.textStyles,
                              [key]: { ...style, fontSize: e.target.value }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          {['12px', '14px', '16px', '18px', '20px', '24px'].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <select
                          value={style.fontWeight}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            textStyles: {
                              ...prev.textStyles,
                              [key]: { ...style, fontWeight: e.target.value }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          {['normal', 'medium', 'semibold', 'bold'].map(weight => (
                            <option key={weight} value={weight}>{weight}</option>
                          ))}
                        </select>
                        <div className="col-span-2 flex gap-2 items-center">
                          <input
                            type="color"
                            value={style.color}
                            onChange={(e) => setStyles(prev => ({
                              ...prev,
                              textStyles: {
                                ...prev.textStyles,
                                [key]: { ...style, color: e.target.value }
                              }
                            }))}
                            className="w-8 h-8 p-0 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={style.color}
                            onChange={(e) => setStyles(prev => ({
                              ...prev,
                              textStyles: {
                                ...prev.textStyles,
                                [key]: { ...style, color: e.target.value }
                              }
                            }))}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Header & Footer Panel */}
              <div className={`border-t mt-4 pt-4 ${selectedPanel === 'header' ? '' : 'hidden'}`}>
                <div className="space-y-4 p-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Company Information</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={styles.header?.companyName || ''}
                        onChange={(e) => setStyles(prev => ({
                          ...prev,
                          header: { ...prev.header, companyName: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Company Name"
                      />
                      <input
                        type="text"
                        value={styles.header?.companyAddress || ''}
                        onChange={(e) => setStyles(prev => ({
                          ...prev,
                          header: { ...prev.header, companyAddress: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Company Address"
                      />
                      <input
                        type="text"
                        value={styles.header?.companyPhone || ''}
                        onChange={(e) => setStyles(prev => ({
                          ...prev,
                          header: { ...prev.header, companyPhone: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Company Phone"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Footer Options</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={styles.footer?.showPageNumbers || false}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            footer: { ...prev.footer, showPageNumbers: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Show Page Numbers</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={styles.footer?.showProjectReference || false}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            footer: { ...prev.footer, showProjectReference: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Show Project Reference</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={styles.footer?.showDate || false}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            footer: { ...prev.footer, showDate: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Show Date</span>
                      </label>
                      <div>
                        <label className="block text-sm mb-1">Custom Footer Text</label>
                        <input
                          type="text"
                          value={styles.footer?.customText || ''}
                          onChange={(e) => setStyles(prev => ({
                            ...prev,
                            footer: { ...prev.footer, customText: e.target.value }
                          }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder="Enter custom footer text"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Logo Position</h3>
                    <select
                      value={styles.header?.logo?.position || 'left'}
                      onChange={(e) => setStyles(prev => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          logo: { ...prev.header?.logo, position: e.target.value as 'left' | 'center' | 'right' }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Panel */}
          <div className="flex-1 bg-muted/10 p-8 overflow-y-auto">
            <div 
              className="mx-auto bg-white shadow-lg"
              style={{
                width: '8.5in',
                height: '11in',
                padding: '1in',
                marginBottom: '2rem',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <div style={{
                  height: styles.header?.logo?.maxHeight || '60px',
                  alignSelf: styles.header?.logo?.position === 'left' ? 'flex-start' : 
                           styles.header?.logo?.position === 'center' ? 'center' : 'flex-end'
                }}>
                  <img
                    src="/images/logos/logo_light_background.svg"
                    alt="Company Logo"
                    style={{
                      height: '100%',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div className="text-right">
                  <div style={{
                    fontSize: styles.textStyles?.title?.fontSize || '24px',
                    fontWeight: styles.textStyles?.title?.fontWeight || 'bold',
                    color: styles.textStyles?.title?.color || '#1a1a1a'
                  }}>
                    RFI Response
                  </div>
                  <div style={{
                    fontSize: styles.textStyles?.normalText?.fontSize || '14px',
                    color: styles.textStyles?.normalText?.color || '#4a5a6b'
                  }}>
                    {styles.header?.companyName || 'Ostrich'}<br />
                    {styles.header?.companyAddress || '123 Business Street, Suite 100'}<br />
                    {styles.header?.companyPhone || '+1 (555) 123-4567'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div style={{
                      fontSize: styles.textStyles?.normalText?.fontSize || defaultStyles.textStyles.normalText.fontSize,
                      fontWeight: styles.textStyles?.normalText?.fontWeight || defaultStyles.textStyles.normalText.fontWeight,
                      color: styles.textStyles?.normalText?.color || defaultStyles.textStyles.normalText.color,
                      textAlign: styles.textStyles?.normalText?.alignment || defaultStyles.textStyles.normalText.alignment
                    }}>
                      John Smith<br />
                      Acme Corporation<br />
                      123 Client Street<br />
                      City, State 12345
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: styles.textStyles?.normalText?.fontSize || defaultStyles.textStyles.normalText.fontSize,
                      fontWeight: styles.textStyles?.normalText?.fontWeight || defaultStyles.textStyles.normalText.fontWeight,
                      color: styles.textStyles?.normalText?.color || defaultStyles.textStyles.normalText.color,
                      textAlign: styles.textStyles?.normalText?.alignment || defaultStyles.textStyles.normalText.alignment
                    }}>
                      Website Redesign<br />
                      PRJ-001
                    </div>
                  </div>
                </div>
                
                <div>
                  <div style={{
                    fontSize: styles.textStyles?.sectionHeaders?.fontSize || defaultStyles.textStyles.sectionHeaders.fontSize,
                    fontWeight: styles.textStyles?.sectionHeaders?.fontWeight || defaultStyles.textStyles.sectionHeaders.fontWeight,
                    color: styles.textStyles?.sectionHeaders?.color || defaultStyles.textStyles.sectionHeaders.color,
                    textAlign: styles.textStyles?.sectionHeaders?.alignment || defaultStyles.textStyles.sectionHeaders.alignment
                  }}>
                    Description
                  </div>
                  <div style={{
                    fontSize: styles.textStyles?.normalText?.fontSize || defaultStyles.textStyles.normalText.fontSize,
                    fontWeight: styles.textStyles?.normalText?.fontWeight || defaultStyles.textStyles.normalText.fontWeight,
                    color: styles.textStyles?.normalText?.color || defaultStyles.textStyles.normalText.color,
                    textAlign: styles.textStyles?.normalText?.alignment || defaultStyles.textStyles.normalText.alignment
                  }}>
                    <p className="mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    
                    <ul style={{
                      listStyleType: styles.lists?.bullet?.style || 'disc',
                      paddingLeft: '1.5rem',
                      marginBottom: '1rem'
                    }}>
                      <li style={{ marginBottom: `${styles.lists?.spacing || 8}px` }}>First bullet point</li>
                      <li style={{ marginBottom: `${styles.lists?.spacing || 8}px` }}>Second bullet point</li>
                      <li>Third bullet point</li>
                    </ul>
                    
                    <ol style={{
                      listStyleType: styles.lists?.numbered?.style || 'decimal',
                      paddingLeft: '1.5rem'
                    }}>
                      <li style={{ marginBottom: `${styles.lists?.spacing || 8}px` }}>First numbered item</li>
                      <li style={{ marginBottom: `${styles.lists?.spacing || 8}px` }}>Second numbered item</li>
                      <li>Third numbered item</li>
                    </ol>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="absolute bottom-[1in] left-[1in] right-[1in] pt-4 border-t flex justify-between" style={{
                  fontSize: styles.textStyles?.footerText?.fontSize || '12px',
                  color: styles.textStyles?.footerText?.color || '#6b7280'
                }}>
                  <div className="text-left">
                    {styles.footer?.showProjectReference && (
                      <span>Project: PRJ-001 • RFI-001</span>
                    )}
                  </div>
                  <div className="text-center">
                    {styles.footer?.showDate && (
                      <span>Date: {new Date().toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {styles.footer?.showPageNumbers && (
                      <span>Page 1 of 1</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}