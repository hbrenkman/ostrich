'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, ChevronDown, ChevronRight, Move, Type, Palette, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../frontend/components';
import { useInvoiceTemplate } from '../../hooks/useInvoiceTemplate';
import type { InvoiceTemplateStyles, TextStyle } from '../../types';

const defaultStyles: InvoiceTemplateStyles = {
  textStyles: {
    companyName: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#4A5A6B',
      alignment: 'left'
    },
    invoiceTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1A2E44',
      alignment: 'right'
    },
    sectionHeaders: {
      fontSize: '16px',
      fontWeight: 'semibold',
      color: '#4A5A6B',
      alignment: 'left'
    },
    normalText: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#4A5A6B',
      alignment: 'left'
    },
    footerText: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#4A5A6B',
      alignment: 'center'
    },
    notesText: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#4A5A6B',
      alignment: 'left'
    }
  },
  addressFormat: {
    billTo: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#4A5A6B',
      alignment: 'left',
      format: 'multiline',
      separator: ', '
    },
    shipTo: {
      fontSize: '12px',
      fontWeight: 'normal',
      color: '#4A5A6B',
      alignment: 'left',
      format: 'multiline',
      separator: ', '
    }
  },
  layout: {
    margins: {
      top: '1in'
    },
    logo: {
      position: 'left',
      maxHeight: '120px'
    }
  },
  footer: {
    companyAddress: '123 Business Street, Suite 100, San Francisco, CA 94105',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'billing@company.com',
    companyWebsite: 'www.company.com',
    notes: 'Payment is due within 30 days of the invoice date.'
  },
  styling: {
    fontFamily: 'sans-serif',
    background: '#FFFFFF',
    text: '#4A5A6B',
    accent: '#D4A017',
    tableStyle: 'simple',
    clientInfoLayout: 'standard',
    addressFormat: 'standard'
  }
};

export function InvoiceTemplateEditor() {
  const { template, setTemplate, loading, error, saveTemplate } = useInvoiceTemplate();
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['textStyles', 'layout', 'styling']));
  const [styles, setStyles] = useState<InvoiceTemplateStyles>(defaultStyles);

  const handlePanelClick = (panel: string) => {
    if (selectedPanel === panel) {
      setSelectedPanel(null);
    } else {
      setSelectedPanel(panel);
    }
  };

  const toggleSection = (sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (collapsedSections.has(sectionKey)) {
      newCollapsed.delete(sectionKey);
    } else {
      newCollapsed.add(sectionKey);
    }
    setCollapsedSections(newCollapsed);
  };

  useEffect(() => {
    if (template?.content) {
      try {
        const parsedStyles = JSON.parse(template.content);
        // Merge parsed styles with default styles to ensure all properties exist
        setStyles({
          ...defaultStyles,
          ...parsedStyles,
          layout: {
            ...defaultStyles.layout,
            ...parsedStyles.layout,
            margins: {
              ...defaultStyles.layout.margins,
              ...(parsedStyles.layout?.margins || {})
            }
          }
        });
      } catch (e) {
        console.error('Failed to parse template styles:', e);
        setStyles(defaultStyles);
      }
    }
  }, [template]);

  const handleTextStyleChange = (
    styleKey: keyof InvoiceTemplateStyles['textStyles'],
    property: keyof TextStyle,
    value: string
  ) => {
    setStyles(prev => ({
      ...prev,
      textStyles: {
        ...prev.textStyles,
        [styleKey]: {
          ...prev.textStyles[styleKey],
          [property]: value
        }
      }
    }));
  };

  const handleAddressFormatChange = (
    type: keyof InvoiceTemplateStyles['addressFormat'],
    property: keyof typeof styles.addressFormat.billTo,
    value: string
  ) => {
    setStyles(prev => ({
      ...prev,
      addressFormat: {
        ...prev.addressFormat,
        [type]: {
          ...prev.addressFormat[type],
          [property]: value
        }
      }
    }));
  };

  const handleLayoutChange = (property: string, value: string) => {
    setStyles(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        logo: {
          ...prev.layout.logo,
          [property]: value
        },
        margins: prev.layout.margins
      }
    }));
  };

  const handleStylingChange = (property: keyof typeof styles.styling, value: string) => {
    setStyles(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        [property]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      await saveTemplate({
        name: 'Default Template',
        content: JSON.stringify(styles),
        isDefault: true
      });
      alert('Template saved successfully!');
    } catch (error) {
      alert('Failed to save template');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading template: {error.message}</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">Invoice Template Editor</h1>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
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
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedPanel === 'textStyles' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Styles</span>
              </button>
              <button
                onClick={() => handlePanelClick('layout')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedPanel === 'layout' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                }`}
              >
                <Move className="w-4 h-4" />
                <span>Layout</span>
              </button>
              <button
                onClick={() => handlePanelClick('styling')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedPanel === 'styling' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Styling</span>
              </button>
            </div>

            {/* Text Styles Panel */}
            <div className={selectedPanel === 'textStyles' ? '' : 'hidden'}>
              <button
                onClick={() => toggleSection('textStyles')}
                className="w-full flex items-center justify-between text-sm font-medium mb-2 hover:bg-gray-50 p-2 rounded"
              >
                <span>Text Styles</span>
                {collapsedSections.has('textStyles') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <div className={collapsedSections.has('textStyles') ? 'hidden' : ''}>
              {styles.textStyles && Object.entries(styles.textStyles).map(([key, style]) => (
                <div key={key} className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <select
                      value={style.fontSize}
                      onChange={(e) => handleTextStyleChange(
                        key as keyof InvoiceTemplateStyles['textStyles'],
                        'fontSize',
                        e.target.value
                      )}
                      className="px-1 py-0.5 text-xs border rounded"
                    >
                      {['10px', '12px', '14px', '16px', '18px', '24px', '32px'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <select
                      value={style.fontWeight}
                      onChange={(e) => handleTextStyleChange(
                        key as keyof InvoiceTemplateStyles['textStyles'],
                        'fontWeight',
                        e.target.value
                      )}
                      className="px-1 py-0.5 text-xs border rounded"
                    >
                      {['normal', 'medium', 'semibold', 'bold'].map(weight => (
                        <option key={weight} value={weight}>{weight}</option>
                      ))}
                    </select>
                    <div className="col-span-2 flex gap-1 mt-1">
                      <input
                        type="color"
                        value={style.color}
                        onChange={(e) => handleTextStyleChange(
                          key as keyof InvoiceTemplateStyles['textStyles'],
                          'color',
                          e.target.value
                        )}
                        className="w-6 h-6 rounded cursor-pointer border"
                      />
                      <select
                        value={style.alignment}
                        onChange={(e) => handleTextStyleChange(
                          key as keyof InvoiceTemplateStyles['textStyles'],
                          'alignment',
                          e.target.value as TextStyle['alignment']
                        )}
                        className="flex-1 px-1 py-0.5 text-xs border rounded"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
            
            {/* Layout Panel */}
            <div className={selectedPanel === 'layout' ? '' : 'hidden'}>
              <button
                onClick={() => toggleSection('layout')}
                className="w-full flex items-center justify-between text-sm font-medium mb-2 hover:bg-gray-50 p-2 rounded"
              >
                <span>Layout Settings</span>
                {collapsedSections.has('layout') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <div className={collapsedSections.has('layout') ? 'hidden' : ''}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Top Margin
                  </label>
                  <input
                    type="text"
                    value={styles.layout?.margins?.top || defaultStyles.layout.margins.top}
                    onChange={(e) => handleLayoutChange('top', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Logo Position
                  </label>
                  <div className="space-y-2">
                    <select
                      value={styles.layout?.logo?.position || defaultStyles.layout.logo.position}
                      onChange={(e) => handleLayoutChange('position', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                    <label className="block text-xs font-medium text-gray-700 mt-2 mb-1">
                      Logo Height
                    </label>
                    <select
                      value={styles.layout?.logo?.maxHeight || defaultStyles.layout.logo.maxHeight}
                      onChange={(e) => handleLayoutChange('maxHeight', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded"
                    >
                      <option value="40px">Small (40px)</option>
                      <option value="60px">Medium (60px)</option>
                      <option value="80px">Large (80px)</option>
                      <option value="100px">X-Large (100px)</option>
                      <option value="120px">XX-Large (120px)</option>
                    </select>
                  </div>
                </div>
              </div>
              </div>
            </div>
            
            {/* Styling Panel */}
            <div className={selectedPanel === 'styling' ? '' : 'hidden'}>
              <button
                onClick={() => toggleSection('styling')}
                className="w-full flex items-center justify-between text-sm font-medium mb-2 hover:bg-gray-50 p-2 rounded"
              >
                <span>Visual Styling</span>
                {collapsedSections.has('styling') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <div className={collapsedSections.has('styling') ? 'hidden' : ''}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={styles.styling?.fontFamily || defaultStyles.styling.fontFamily}
                    onChange={(e) => handleStylingChange('fontFamily', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  >
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styles.styling?.background || defaultStyles.styling.background}
                      onChange={(e) => handleStylingChange('background', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={styles.styling?.background || defaultStyles.styling.background}
                      onChange={(e) => handleStylingChange('background', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styles.styling?.text || defaultStyles.styling.text}
                      onChange={(e) => handleStylingChange('text', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={styles.styling?.text || defaultStyles.styling.text}
                      onChange={(e) => handleStylingChange('text', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styles.styling?.accent || defaultStyles.styling.accent}
                      onChange={(e) => handleStylingChange('accent', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={styles.styling?.accent || defaultStyles.styling.accent}
                      onChange={(e) => handleStylingChange('accent', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Table Style
                  </label>
                  <select
                    value={styles.styling?.tableStyle || defaultStyles.styling.tableStyle}
                    onChange={(e) => handleStylingChange('tableStyle', e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                  >
                    <option value="simple">Simple</option>
                    <option value="bordered">Bordered</option>
                    <option value="striped">Striped</option>
                  </select>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-muted/10 p-8 overflow-y-auto">
          <div 
            className="w-[8.5in] h-[11in] mx-auto bg-background shadow-lg relative"
            style={{
              padding: styles.layout?.margins?.top || defaultStyles.layout.margins.top,
              fontFamily: styles.styling?.fontFamily || defaultStyles.styling.fontFamily,
              backgroundColor: styles.styling?.background || defaultStyles.styling.background,
              color: styles.styling?.text || defaultStyles.styling.text
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div
                style={{
                  height: styles.layout?.logo?.maxHeight || defaultStyles.layout.logo.maxHeight,
                  alignSelf: styles.layout?.logo?.position || defaultStyles.layout.logo.position,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <img
                  src={styles.styling?.background === '#FFFFFF' ? '/images/logos/logo_light_background.svg' : '/images/logos/logo_dark_background.svg'}
                  alt="Company Logo"
                  style={{
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div style={{
                fontSize: styles.textStyles?.invoiceTitle?.fontSize || defaultStyles.textStyles.invoiceTitle.fontSize,
                fontWeight: styles.textStyles?.invoiceTitle?.fontWeight || defaultStyles.textStyles.invoiceTitle.fontWeight,
                color: styles.textStyles?.invoiceTitle?.color || defaultStyles.textStyles.invoiceTitle.color,
                textAlign: styles.textStyles?.invoiceTitle?.alignment || defaultStyles.textStyles.invoiceTitle.alignment
              }}>
                INVOICE
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div style={{
                    fontSize: styles.textStyles?.sectionHeaders?.fontSize || defaultStyles.textStyles.sectionHeaders.fontSize,
                    fontWeight: styles.textStyles?.sectionHeaders?.fontWeight || defaultStyles.textStyles.sectionHeaders.fontWeight,
                    color: styles.textStyles?.sectionHeaders?.color || defaultStyles.textStyles.sectionHeaders.color,
                    textAlign: styles.textStyles?.sectionHeaders?.alignment || defaultStyles.textStyles.sectionHeaders.alignment
                  }}>
                    Bill To
                  </div>
                  <div style={{
                    fontSize: styles.addressFormat?.billTo?.fontSize || defaultStyles.addressFormat.billTo.fontSize,
                    fontWeight: styles.addressFormat?.billTo?.fontWeight || defaultStyles.addressFormat.billTo.fontWeight,
                    color: styles.addressFormat?.billTo?.color || defaultStyles.addressFormat.billTo.color,
                    textAlign: styles.addressFormat?.billTo?.alignment || defaultStyles.addressFormat.billTo.alignment
                  }}>
                    Client Name<br />
                    123 Client Street<br />
                    City, State 12345
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: styles.textStyles?.sectionHeaders?.fontSize || defaultStyles.textStyles.sectionHeaders.fontSize,
                    fontWeight: styles.textStyles?.sectionHeaders?.fontWeight || defaultStyles.textStyles.sectionHeaders.fontWeight,
                    color: styles.textStyles?.sectionHeaders?.color || defaultStyles.textStyles.sectionHeaders.color,
                    textAlign: styles.textStyles?.sectionHeaders?.alignment || defaultStyles.textStyles.sectionHeaders.alignment
                  }}>
                    Invoice Details
                  </div>
                  <div style={{
                    fontSize: styles.textStyles?.normalText?.fontSize || defaultStyles.textStyles.normalText.fontSize,
                    fontWeight: styles.textStyles?.normalText?.fontWeight || defaultStyles.textStyles.normalText.fontWeight,
                    color: styles.textStyles?.normalText?.color || defaultStyles.textStyles.normalText.color,
                    textAlign: styles.textStyles?.normalText?.alignment || defaultStyles.textStyles.normalText.alignment
                  }}>
                    Invoice #: INV-001<br />
                    Date: March 21, 2024<br />
                    Due Date: April 20, 2024
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div style={{
                  fontSize: styles.textStyles?.sectionHeaders?.fontSize || defaultStyles.textStyles.sectionHeaders.fontSize,
                  fontWeight: styles.textStyles?.sectionHeaders?.fontWeight || defaultStyles.textStyles.sectionHeaders.fontWeight,
                  color: styles.textStyles?.sectionHeaders?.color || defaultStyles.textStyles.sectionHeaders.color,
                  textAlign: styles.textStyles?.sectionHeaders?.alignment || defaultStyles.textStyles.sectionHeaders.alignment
                }}>
                  Items
                </div>
                <table className="w-full mt-2" style={{
                  fontSize: styles.textStyles?.normalText?.fontSize || defaultStyles.textStyles.normalText.fontSize,
                  color: styles.textStyles?.normalText?.color || defaultStyles.textStyles.normalText.color
                }}>
                  <thead>
                    <tr className="border-b" style={{ borderColor: styles.styling?.accent || defaultStyles.styling.accent }}>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Rate</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { desc: 'Website Design', qty: 1, rate: 2500.00, amount: 2500.00 },
                      { desc: 'Frontend Development', qty: 80, rate: 150.00, amount: 12000.00 },
                      { desc: 'Backend Integration', qty: 60, rate: 175.00, amount: 10500.00 },
                      { desc: 'Database Setup', qty: 20, rate: 200.00, amount: 4000.00 },
                      { desc: 'Testing & QA', qty: 40, rate: 125.00, amount: 5000.00 }
                    ].map((item, index) => (
                      <tr 
                        key={index} 
                        className={`border-b ${styles.styling?.tableStyle === 'striped' && index % 2 === 1 ? 'bg-gray-50' : ''}`}
                        style={{ 
                          borderColor: styles.styling?.accent || defaultStyles.styling.accent,
                          ...(styles.styling?.tableStyle === 'bordered' ? {
                            borderLeft: `1px solid ${styles.styling?.accent || defaultStyles.styling.accent}`,
                            borderRight: `1px solid ${styles.styling?.accent || defaultStyles.styling.accent}`
                          } : {})
                        }}
                      >
                        <td className="py-2 px-3">{item.desc}</td>
                        <td className="text-right py-2 px-3">{item.qty}</td>
                        <td className="text-right py-2 px-3">${item.rate.toFixed(2)}</td>
                        <td className="text-right py-2 px-3">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t" style={{ borderColor: styles.styling?.accent || defaultStyles.styling.accent }}>
                      <td colSpan={3} className="text-right py-2">Total:</td>
                      <td className="text-right py-2">$34,000.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="absolute bottom-[1in] left-[1in] right-[1in] pt-4 text-center"
              style={{
                borderTop: `1px solid ${styles.styling?.accent || defaultStyles.styling.accent}`,
                fontSize: styles.textStyles?.footerText?.fontSize || defaultStyles.textStyles.footerText.fontSize,
                fontWeight: styles.textStyles?.footerText?.fontWeight || defaultStyles.textStyles.footerText.fontWeight,
                color: styles.textStyles?.footerText?.color || defaultStyles.textStyles.footerText.color,
                textAlign: styles.textStyles?.footerText?.alignment || defaultStyles.textStyles.footerText.alignment
              }}
            >
              {styles.footer?.companyAddress || defaultStyles.footer.companyAddress}<br />
              Phone: {styles.footer?.companyPhone || defaultStyles.footer.companyPhone} | Email: {styles.footer?.companyEmail || defaultStyles.footer.companyEmail}<br />
              {styles.footer?.companyWebsite || defaultStyles.footer.companyWebsite}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}