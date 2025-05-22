"use client";

import { useState, useEffect, useRef } from 'react';
import { Settings, Palette, Save, FileText, Bird, Upload, X, Info, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminSettings() {
  const [platformSettings, setPlatformSettings] = useState({
    appearance: {
      compactMode: false,
      menuPosition: 'left',
      showBreadcrumbs: true
    },
    notifications: {
      email: true,
      inApp: true,
      desktop: false
    },
    security: {
      twoFactor: true,
      sessionTimeout: 30,
      passwordExpiry: 90
    }
  });

  const [companyBranding, setCompanyBranding] = useState({
    logos: {
      light: '/images/logos/logo_light_background.svg',
      dark: '/images/logos/logo_dark_background.svg'
    },
    colors: {
      background: '#FFFFFF',
      text: '#4A5A6B',
      steelGray: '#4A5A6B',
      midnightBlue: '#1A2E44',
      warmTaupe: '#A68A64',
      goldenOchre: '#D4A017',
      lightSkyBlue: '#87CEEB'
    },
    documentation: {
      background: '#FFFFFF',
      text: '#4A5A6B',
      headers: '#1A2E44',
      tables: '#D3D3D3',
      borders: '#D4A017',
      footers: '#A68A64'
    },
    invoice: {
      showLogo: true,
      showHeader: true,
      showFooter: true,
      compactLayout: false,
      useCustomColors: true,
      includeAccentLine: true
    }
  });

  const lightLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if logos exist by trying to load them
    const checkLogo = async (path: string) => {
      try {
        const response = await fetch(path);
        return response.ok;
      } catch {
        return false;
      }
    };

    const validateLogos = async () => {
      const lightLogoExists = await checkLogo(companyBranding.logos.light);
      const darkLogoExists = await checkLogo(companyBranding.logos.dark);

      setCompanyBranding(prev => ({
        ...prev,
        logos: {
          light: lightLogoExists ? prev.logos.light : null,
          dark: darkLogoExists ? prev.logos.dark : null
        }
      }));
    };

    validateLogos();
  }, []);

  const handlePlatformSettingChange = (category: string, setting: string) => {
    setPlatformSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleColorChange = (category: 'colors' | 'documentation', key: string, value: string) => {
    setCompanyBranding(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleInvoiceSettingChange = (setting: string) => {
    setCompanyBranding(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [setting]: !prev.invoice[setting]
      }
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an SVG or PNG file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Upload file
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }
      
      const data = await response.json();

      // Update UI with the new logo path
      setCompanyBranding(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [type]: data.path
        }
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert(`Failed to upload logo: ${error.message}`);
    }
  };

  const removeLogo = (type: 'light' | 'dark') => {
    setCompanyBranding(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [type]: null
      }
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformSettings,
          companyBranding
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const LogoUploadInfo = () => (
    <div className="p-3 space-y-2">
      <h3 className="font-medium mb-2">Logo Requirements</h3>
      <ul className="space-y-1 text-sm">
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span>SVG format preferred (PNG accepted)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span>Maximum file size: 2MB</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span>Recommended size: 300x100px</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span>Transparent background recommended</span>
        </li>
      </ul>
      <div className="mt-4 text-xs text-gray-500">
        Files will be automatically renamed to:
        <div className="font-mono mt-1 bg-gray-100 dark:bg-gray-800 p-1 rounded">
          logo_light_background.svg
          <br />
          logo_dark_background.svg
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-h1">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bird className="w-5 h-5 text-accent" />
            <h2 className="text-h2">Platform Settings</h2>
          </div>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-sm">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(platformSettings.appearance).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handlePlatformSettingChange('appearance', key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-sm">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(platformSettings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handlePlatformSettingChange('notifications', key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-sm">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(platformSettings.security).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                  {typeof value === 'boolean' ? (
                    <Switch
                      checked={value}
                      onCheckedChange={() => handlePlatformSettingChange('security', key)}
                    />
                  ) : (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setPlatformSettings(prev => ({
                        ...prev,
                        security: {
                          ...prev.security,
                          [key]: parseInt(e.target.value)
                        }
                      }))}
                      className="w-20 px-2 py-1 text-sm border rounded bg-background text-foreground"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Company Branding Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Company Branding</h2>
          </div>

          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Logos Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Company Logos</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                      <Info className="w-4 h-4" />
                      <span>Requirements</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <LogoUploadInfo />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  {/* Logo for Light Background */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Logo for Light Background
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-40 h-20 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                        {companyBranding.logos.light ? (
                          <div className="relative w-full h-full">
                            <img
                              src={companyBranding.logos.light}
                              alt="Logo on light background"
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => removeLogo('light')}
                              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-500">No logo uploaded</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={lightLogoRef}
                        type="file"
                        accept=".svg,.png"
                        onChange={(e) => handleLogoUpload(e, 'light')}
                        className="hidden"
                      />
                      <button
                        onClick={() => lightLogoRef.current?.click()}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        {companyBranding.logos.light ? 'Change Logo' : 'Upload Logo'}
                      </button>
                    </div>
                  </div>

                  {/* Logo for Dark Background */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Logo for Dark Background
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-40 h-20 bg-gray-800 border rounded-lg flex items-center justify-center overflow-hidden">
                        {companyBranding.logos.dark ? (
                          <div className="relative w-full h-full">
                            <img
                              src={companyBranding.logos.dark}
                              alt="Logo on dark background"
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => removeLogo('dark')}
                              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-400">No logo uploaded</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={darkLogoRef}
                        type="file"
                        accept=".svg,.png"
                        onChange={(e) => handleLogoUpload(e, 'dark')}
                        className="hidden"
                      />
                      <button
                        onClick={() => darkLogoRef.current?.click()}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        {companyBranding.logos.dark ? 'Change Logo' : 'Upload Logo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Brand Colors Section */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Brand Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(companyBranding.colors).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-xs capitalize text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange('colors', key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-2 border-border bg-background"
                          />
                        </div>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange('colors', key, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Document Colors Section */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Document Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(companyBranding.documentation).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-xs capitalize text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange('documentation', key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-2 border-border bg-background"
                          />
                        </div>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange('documentation', key, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Invoice Settings Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Invoice Settings</h3>
                  <Link
                    href="/admin/settings/templates/invoice"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Edit Template</span>
                  </Link>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Report Templates</h3>
                  <Link
                    href="/reports/templates"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Edit Templates</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(companyBranding.invoice).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-foreground">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <Switch
                        checked={value}
                        onCheckedChange={() => handleInvoiceSettingChange(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveChanges}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}