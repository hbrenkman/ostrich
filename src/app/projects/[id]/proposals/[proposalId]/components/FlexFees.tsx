import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Pencil, FolderPlus, FilePlus, FilePlus2, FileIcon, FileClock, Save, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Discipline {
  id: number;
  name: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface HourlyRate {
  id: number;
  discipline_id: number;
  role_id: string;
  role_designation: string | null;
  rate: number;
  description: string | null;
}

interface FeeSubcomponent {
  id: string;
  name: string;
  amount: number;
  type: 'simple' | 'hourly' | undefined;
  hourlyRate?: number;
  hours?: number;
  minFee?: number;
  maxFee?: number;
  discipline_id?: number;
  role_id?: string;
  role_designation?: string | null;
  description?: string;
  quantity?: number;
}

interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  type: 'simple' | 'hourly' | undefined;
  hourlyRate?: number;
  hours?: number;
  minFee?: number;
  maxFee?: number;
  subcomponents?: FeeSubcomponent[];
  discipline_id?: number;
  role_id?: string;
  role_designation?: string | null;
  description?: string;
  quantity?: number;
}

interface Category {
  id: string;
  name: string;
  fees: FeeComponent[];
}

const FlexFees: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
  const [categoryCounter, setCategoryCounter] = useState(0);
  const [feeCounter, setFeeCounter] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragAddIndex, setDragAddIndex] = useState<number | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingFeeName, setEditingFeeName] = useState('');
  const [feeSubCounter, setFeeSubCounter] = useState(0);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [editingHoursValue, setEditingHoursValue] = useState('');
  const hoursInputRef = useRef<HTMLDivElement>(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState('');
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingAmountValue, setEditingAmountValue] = useState('');
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [editingQuantityValue, setEditingQuantityValue] = useState('');
  const descriptionInputRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLDivElement>(null);
  const [draggedFeeId, setDraggedFeeId] = useState<{ categoryId: string; feeId: string } | null>(null);
  const [draggedSubId, setDraggedSubId] = useState<{ categoryId: string; feeId: string; subId: string } | null>(null);
  const [dragOverFeeIndex, setDragOverFeeIndex] = useState<{ categoryId: string; index: number } | null>(null);
  const [dragOverSubIndex, setDragOverSubIndex] = useState<{ categoryId: string; feeId: string; index: number } | null>(null);
  const [dragOverFeeId, setDragOverFeeId] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Fetch disciplines, roles, and hourly rates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch disciplines
        const disciplinesResponse = await fetch('/api/disciplines');
        if (!disciplinesResponse.ok) throw new Error('Failed to fetch disciplines');
        const disciplinesData = await disciplinesResponse.json();
        setDisciplines(disciplinesData);

        // Fetch roles
        const rolesResponse = await fetch('/api/roles');
        if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.filter((role: Role) => role.is_active));

        // Fetch hourly rates
        const ratesResponse = await fetch('/api/hourly-rates');
        if (!ratesResponse.ok) throw new Error('Failed to fetch hourly rates');
        const ratesData = await ratesResponse.json();
        console.log('Loaded hourly rates:', ratesData);
        setHourlyRates(ratesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Get available roles with designations for a discipline
  const getAvailableRoles = (disciplineId: number) => {
    console.log('Getting available roles for discipline:', disciplineId);
    const ratesForDiscipline = hourlyRates.filter(rate => rate.discipline_id === disciplineId);
    console.log('Rates for discipline:', ratesForDiscipline);
    
    const uniqueRoles = new Map<string, { role: Role; designation: string | null }>();
    
    ratesForDiscipline.forEach(rate => {
      const role = roles.find(r => r.id === rate.role_id);
      if (role) {
        uniqueRoles.set(`${role.id}-${rate.role_designation}`, {
          role,
          designation: rate.role_designation
        });
      }
    });

    const availableRoles = Array.from(uniqueRoles.values());
    console.log('Available roles:', availableRoles);
    return availableRoles;
  };

  // Get rate for a specific role and designation
  const getRateForRole = (disciplineId: number, roleId: string, designation: string | null) => {
    console.log('getRateForRole called with:', { 
      disciplineId, 
      roleId, 
      designation,
      type: {
        disciplineId: typeof disciplineId,
        roleId: typeof roleId,
        designation: typeof designation
      }
    });
    
    // First filter by discipline
    const ratesForDiscipline = hourlyRates.filter(rate => rate.discipline_id === disciplineId);
    console.log('Rates for discipline:', ratesForDiscipline);
    
    if (ratesForDiscipline.length === 0) {
      console.log('No rates found for discipline:', disciplineId);
      return undefined;
    }
    
    // Then filter by role
    const ratesForRole = ratesForDiscipline.filter(rate => rate.role_id === roleId);
    console.log('Rates for role:', ratesForRole);
    
    if (ratesForRole.length === 0) {
      console.log('No rates found for role:', roleId);
      return undefined;
    }
    
    // Finally filter by designation
    const rate = ratesForRole.find(rate => rate.role_designation === designation);
    console.log('Found rate for designation:', rate);
    
    if (!rate) {
      console.log('No rate found for designation:', designation);
      console.log('Available designations:', ratesForRole.map(r => r.role_designation));
    }
    
    return rate;
  };

  // Update fee component with selected role and rate
  const updateFeeWithRole = (categoryId: string, feeId: string, roleId: string, designation: string | null) => {
    console.log('updateFeeWithRole called with:', { categoryId, feeId, roleId, designation });
    
    const fee = categories
      .find(cat => cat.id === categoryId)
      ?.fees.find(f => f.id === feeId);
    
    console.log('Found fee:', fee);
    
    if (!fee?.discipline_id) {
      console.log('No discipline_id found for fee:', fee);
      return;
    }

    const rate = getRateForRole(fee.discipline_id, roleId, designation);
    console.log('Rate from getRateForRole:', rate);

    if (!rate) {
      console.log('No rate found for the given parameters');
      return;
    }

    console.log('Updating fee with rate:', rate.rate);

    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    type: 'hourly',
                    hourlyRate: rate.rate,
                    minFee: undefined,
                    maxFee: undefined,
                    role_id: roleId,
                    role_designation: designation,
                    hours: f.hours || 0
                  }
                : f
            ),
          }
        : cat
    ));
  };

  // Get available rates for a discipline and role combination
  const getAvailableRates = (disciplineId: number, roleId: string) => {
    return hourlyRates.filter(rate => 
      rate.discipline_id === disciplineId && 
      rate.role_id === roleId
    );
  };

  // Update fee component with selected rate
  const updateFeeWithRate = (categoryId: string, feeId: string, rate: HourlyRate) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(fee =>
              fee.id === feeId
                ? {
                    ...fee,
                    type: 'hourly',
                    hourlyRate: rate.rate,
                    minFee: undefined,
                    maxFee: undefined,
                    discipline_id: rate.discipline_id,
                    role_id: rate.role_id,
                    role_designation: rate.role_designation
                  }
                : fee
            ),
          }
        : cat
    ));
  };

  // Add category at a specific index
  const addCategoryAt = (index: number) => {
    const newId = `cat-${categoryCounter}`;
    const newCategory: Category = {
      id: newId,
      name: 'New Category',
      fees: [],
    };
    const newCategories = [...categories];
    newCategories.splice(index, 0, newCategory);
    setCategories(newCategories);
    setCategoryCounter(categoryCounter + 1);
  };

  // Update category name
  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, name } : cat
    ));
  };

  // Delete category and its children
  const deleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  // Add fee with deterministic ID
  const addFee = (categoryId: string, index: number) => {
    const newFee: FeeComponent = {
      id: `fee-${feeCounter}`,
      name: 'New Fee',
      amount: 0,
      type: undefined, // No default type
    };
    setFeeCounter(prev => prev + 1);
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: [
              ...cat.fees.slice(0, index + 1),
              newFee,
              ...cat.fees.slice(index + 1)
            ]
          }
        : cat
    ));
  };

  // Handle save of category name
  const saveCategoryName = (categoryId: string) => {
    updateCategoryName(categoryId, editingCategoryName.trim() || 'Untitled Category');
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (categoryId: string) => {
    setDraggedCategoryId(categoryId);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedCategoryId) {
      const fromIndex = categories.findIndex(cat => cat.id === draggedCategoryId);
      if (fromIndex !== -1 && fromIndex !== index) {
        const updated = [...categories];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(index, 0, moved);
        setCategories(updated);
      }
    }
    setDraggedCategoryId(null);
    setDragOverIndex(null);
  };

  // Drag and drop handlers for Add Category button
  const handleAddDragStart = () => {
    setDragAddIndex(-1); // -1 means dragging add button
  };

  const handleAddDragOver = (index: number) => {
    setDragAddIndex(index);
  };

  const handleAddDrop = (index: number) => {
    addCategoryAt(categories.length);
    setDragAddIndex(null);
  };

  // Update fee component name
  const updateFeeName = (categoryId: string, feeId: string, name: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(fee =>
              fee.id === feeId ? { ...fee, name } : fee
            ),
          }
        : cat
    ));
  };

  // Save fee component name
  const saveFeeName = (categoryId: string, feeId: string) => {
    updateFeeName(categoryId, feeId, editingFeeName.trim() || 'Untitled Component');
    setEditingFeeId(null);
    setEditingFeeName('');
  };

  // Update fee component type
  const setFeeType = (categoryId: string, feeId: string, type: 'simple' | 'hourly') => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(fee =>
              fee.id === feeId ? { ...fee, type } : fee
            ),
          }
        : cat
    ));
  };

  // Update subcomponent type
  const setSubType = (categoryId: string, feeId: string, subId: string, type: 'simple' | 'hourly') => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(fee =>
              fee.id === feeId
                ? {
                    ...fee,
                    subcomponents: fee.subcomponents?.map(sub =>
                      sub.id === subId 
                        ? { 
                            ...sub, 
                            type,
                            // Reset fields based on type
                            ...(type === 'simple' 
                              ? { 
                                  amount: 0,
                                  hourlyRate: undefined,
                                  hours: undefined,
                                  discipline_id: undefined,
                                  role_id: undefined,
                                  role_designation: undefined
                                }
                              : {
                                  amount: 0,
                                  hourlyRate: undefined,
                                  hours: 0,
                                  minFee: undefined,
                                  maxFee: undefined
                                }
                            )
                          } 
                        : sub
                    ),
                  }
                : fee
            ),
          }
        : cat
    ));
  };

  // Add subcomponent to a fee component
  const addSubcomponent = (categoryId: string, feeId: string) => {
    const newSubcomponent: FeeSubcomponent = {
      id: `sub-${feeSubCounter}`,
      name: 'New Subcomponent',
      amount: 0,
      type: undefined, // Start with no type
    };
    setFeeSubCounter(prev => prev + 1);
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    type: undefined, // Reset parent component type
                    subcomponents: [...(f.subcomponents || []), newSubcomponent]
                  }
                : f
            ),
          }
        : cat
    ));
  };

  // Calculate total for hourly rate
  const calculateTotal = (rate: number, hours: number): number => {
    return rate * hours;
  };

  // Update hours for a fee component
  const updateHours = (categoryId: string, feeId: string, hours: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId ? { ...f, hours } : f
            ),
          }
        : cat
    ));
  };

  // Handle save of subcomponent name
  const saveSubName = (categoryId: string, feeId: string, subId: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(fee =>
              fee.id === feeId
                ? {
                    ...fee,
                    subcomponents: fee.subcomponents?.map(sub =>
                      sub.id === subId ? { ...sub, name: editingSubName.trim() || 'Untitled Subcomponent' } : sub
                    )
                  }
                : fee
            )
          }
        : cat
    ));
    setEditingSubId(null);
    setEditingSubName('');
  };

  // Add this new function to handle hours editing
  const handleHoursEdit = (categoryId: string, feeId: string, hours: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId ? { ...f, hours } : f
            ),
          }
        : cat
    ));
  };

  // Add this new function to handle hours blur
  const handleHoursBlur = (categoryId: string, feeId: string) => {
    const value = parseFloat(editingHoursValue) || 0;
    handleHoursEdit(categoryId, feeId, value);
    setEditingHoursId(null);
    setEditingHoursValue('');
  };

  // Add this new function to handle hours keydown
  const handleHoursKeyDown = (e: React.KeyboardEvent, categoryId: string, feeId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = parseFloat(editingHoursValue) || 0;
      handleHoursEdit(categoryId, feeId, value);
      setEditingHoursId(null);
      setEditingHoursValue('');
    } else if (e.key === 'Escape') {
      setEditingHoursId(null);
      setEditingHoursValue('');
    }
  };

  // Add handlers for simple fee fields
  const handleDescriptionEdit = (categoryId: string, feeId: string, description: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId ? { ...f, description } : f
            ),
          }
        : cat
    ));
  };

  const handleAmountEdit = (categoryId: string, feeId: string, amount: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId ? { ...f, amount } : f
            ),
          }
        : cat
    ));
  };

  const handleQuantityEdit = (categoryId: string, feeId: string, quantity: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId ? { ...f, quantity } : f
            ),
          }
        : cat
    ));
  };

  // Add handlers for subcomponent fields
  const handleSubDescriptionEdit = (categoryId: string, feeId: string, subId: string, description: string) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    subcomponents: f.subcomponents?.map(s =>
                      s.id === subId ? { ...s, description } : s
                    )
                  }
                : f
            ),
          }
        : cat
    ));
  };

  const handleSubAmountEdit = (categoryId: string, feeId: string, subId: string, amount: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    subcomponents: f.subcomponents?.map(s =>
                      s.id === subId ? { ...s, amount } : s
                    )
                  }
                : f
            ),
          }
        : cat
    ));
  };

  const handleSubQuantityEdit = (categoryId: string, feeId: string, subId: string, quantity: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    subcomponents: f.subcomponents?.map(s =>
                      s.id === subId ? { ...s, quantity } : s
                    )
                  }
                : f
            ),
          }
        : cat
    ));
  };

  const handleSubHoursEdit = (categoryId: string, feeId: string, subId: string, hours: number) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    subcomponents: f.subcomponents?.map(s =>
                      s.id === subId ? { ...s, hours } : s
                    )
                  }
                : f
            ),
          }
        : cat
    ));
  };

  const handleSubHoursBlur = (categoryId: string, feeId: string, subId: string) => {
    const value = parseFloat(editingHoursValue) || 0;
    handleSubHoursEdit(categoryId, feeId, subId, value);
    setEditingHoursId(null);
    setEditingHoursValue('');
  };

  const handleSubHoursKeyDown = (e: React.KeyboardEvent, categoryId: string, feeId: string, subId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = parseFloat(editingHoursValue) || 0;
      handleSubHoursEdit(categoryId, feeId, subId, value);
      setEditingHoursId(null);
      setEditingHoursValue('');
    } else if (e.key === 'Escape') {
      setEditingHoursId(null);
      setEditingHoursValue('');
    }
  };

  // Add a helper function to select all content in a contentEditable div
  const selectAllContent = (element: HTMLDivElement | null) => {
    if (!element) return;
    
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Add a helper function to format the rate display
  const formatRateDisplay = (amount: number) => {
    return `$${amount.toFixed(2)}/item`;
  };

  // Add a helper function to parse the rate input
  const parseRateInput = (input: string): number => {
    // Remove $ and /item, then parse the number
    const cleanInput = input.replace(/[^0-9.]/g, '');
    return parseFloat(cleanInput) || 0;
  };

  // Add this new function to calculate subcomponent totals
  const calculateSubcomponentTotal = (sub: FeeSubcomponent): number => {
    if (sub.type === 'simple') {
      return (sub.amount || 0) * (sub.quantity || 1);
    } else if (sub.type === 'hourly') {
      return (sub.hourlyRate || 0) * (sub.hours || 0);
    }
    return 0;
  };

  // Add this new function to calculate total for all subcomponents
  const calculateSubcomponentsTotal = (subcomponents?: FeeSubcomponent[]): number => {
    if (!subcomponents?.length) return 0;
    return subcomponents.reduce((sum, sub) => sum + calculateSubcomponentTotal(sub), 0);
  };

  // Add this new function to calculate total for a category
  const calculateCategoryTotal = (category: Category): number => {
    return category.fees.reduce((sum, fee) => {
      if (fee.subcomponents?.length) {
        return sum + calculateSubcomponentsTotal(fee.subcomponents);
      } else if (fee.type === 'simple') {
        return sum + ((fee.amount || 0) * (fee.quantity || 1));
      } else if (fee.type === 'hourly') {
        return sum + (fee.hours && fee.hourlyRate ? fee.hourlyRate * fee.hours : 0);
      }
      return sum;
    }, 0);
  };

  // Add helper function for number formatting
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Add handlers for component drag and drop
  const handleFeeDragStart = (categoryId: string, feeId: string) => {
    setDraggedFeeId({ categoryId, feeId });
  };

  const handleFeeDragOver = (e: React.DragEvent, categoryId: string, index: number) => {
    e.preventDefault();
    if (draggedFeeId) {
      setDragOverFeeIndex({ categoryId, index });
    }
  };

  const handleFeeDrop = (categoryId: string, index: number) => {
    if (draggedFeeId) {
      const { categoryId: fromCategoryId, feeId } = draggedFeeId;
      
      // Find the fee being moved
      const fromCategory = categories.find(cat => cat.id === fromCategoryId);
      const fee = fromCategory?.fees.find(f => f.id === feeId);
      
      if (fee) {
        setCategories(categories.map(cat => {
          if (cat.id === fromCategoryId && cat.id === categoryId) {
            // Moving within the same category
            const newFees = [...cat.fees];
            const fromIndex = newFees.findIndex(f => f.id === feeId);
            if (fromIndex !== -1) {
              const [moved] = newFees.splice(fromIndex, 1);
              newFees.splice(index, 0, moved);
            }
            return { ...cat, fees: newFees };
          } else if (cat.id === fromCategoryId) {
            // Remove from source category
            return {
              ...cat,
              fees: cat.fees.filter(f => f.id !== feeId)
            };
          } else if (cat.id === categoryId) {
            // Add to target category
            const newFees = [...cat.fees];
            newFees.splice(index, 0, fee);
            return { ...cat, fees: newFees };
          }
          return cat;
        }));
      }
    }
    setDraggedFeeId(null);
    setDragOverFeeIndex(null);
  };

  // Add handlers for subcomponent drag and drop
  const handleSubDragStart = (categoryId: string, feeId: string, subId: string) => {
    setDraggedSubId({ categoryId, feeId, subId });
  };

  const handleSubDragOver = (e: React.DragEvent, categoryId: string, feeId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSubId) {
      // If dragging over a different component, highlight the entire component
      if (draggedSubId.feeId !== feeId) {
        setDragOverFeeId(feeId);
      } else {
        // If dragging within same component, show the specific drop position
        setDragOverSubIndex({ categoryId, feeId, index });
      }
    }
  };

  const handleSubDrop = (e: React.DragEvent, categoryId: string, feeId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedSubId) {
      const { categoryId: fromCategoryId, feeId: fromFeeId, subId } = draggedSubId;
      
      // Find the subcomponent being moved
      const fromCategory = categories.find(cat => cat.id === fromCategoryId);
      const fromFee = fromCategory?.fees.find(f => f.id === fromFeeId);
      const sub = fromFee?.subcomponents?.find(s => s.id === subId);
      
      if (sub) {
        setCategories(categories.map(cat => {
          if (cat.id === fromCategoryId) {
            // Handle source category
            if (cat.id === categoryId && fromFeeId === feeId) {
              // Moving within the same component
              return {
                ...cat,
                fees: cat.fees.map(f => {
                  if (f.id === feeId && f.subcomponents) {
                    const newSubs = [...f.subcomponents];
                    const fromIndex = newSubs.findIndex(s => s.id === subId);
                    if (fromIndex !== -1) {
                      const [moved] = newSubs.splice(fromIndex, 1);
                      const adjustedIndex = fromIndex < index ? index - 1 : index;
                      newSubs.splice(adjustedIndex, 0, moved);
                    }
                    return { ...f, subcomponents: newSubs };
                  }
                  return f;
                })
              };
            } else {
              // Remove from source component
              return {
                ...cat,
                fees: cat.fees.map(f => {
                  if (f.id === fromFeeId) {
                    return {
                      ...f,
                      subcomponents: f.subcomponents?.filter(s => s.id !== subId)
                    };
                  }
                  return f;
                })
              };
            }
          } else if (cat.id === categoryId) {
            // Handle target category
            return {
              ...cat,
              fees: cat.fees.map(f => {
                if (f.id === feeId) {
                  const newSubs = [...(f.subcomponents || [])];
                  newSubs.splice(index, 0, sub);
                  return { ...f, subcomponents: newSubs };
                }
                return f;
              })
            };
          }
          return cat;
        }));
      }
    }
    setDraggedSubId(null);
    setDragOverSubIndex(null);
    setDragOverFeeId(null);
  };

  // Add handler for when drag leaves a component
  const handleSubDragLeave = (e: React.DragEvent, feeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFeeId === feeId) {
      setDragOverFeeId(null);
    }
  };

  // Add this new function after updateFeeWithRole
  const updateSubWithRole = (categoryId: string, feeId: string, subId: string, roleId: string, designation: string | null) => {
    console.log('updateSubWithRole called with:', { categoryId, feeId, subId, roleId, designation });
    
    const sub = categories
      .find(cat => cat.id === categoryId)
      ?.fees.find(f => f.id === feeId)
      ?.subcomponents?.find(s => s.id === subId);
    
    console.log('Found sub:', sub);
    
    if (!sub?.discipline_id) {
      console.log('No discipline_id found for sub:', sub);
      return;
    }

    const rate = getRateForRole(sub.discipline_id, roleId, designation);
    console.log('Rate from getRateForRole:', rate);

    if (!rate) {
      console.log('No rate found for the given parameters');
      return;
    }

    console.log('Updating sub with rate:', rate.rate);

    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            fees: cat.fees.map(f =>
              f.id === feeId
                ? {
                    ...f,
                    subcomponents: f.subcomponents?.map(s =>
                      s.id === subId
                        ? {
                            ...s,
                            type: 'hourly',
                            hourlyRate: rate.rate,
                            minFee: undefined,
                            maxFee: undefined,
                            role_id: roleId,
                            role_designation: designation,
                            hours: s.hours || 0
                          }
                        : s
                    )
                  }
                : f
            ),
          }
      : cat
    ));
  };

  return (
    <div className="bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold dark:text-[#E5E7EB]">Flex Fees</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
          >
            {isSummaryExpanded ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Hide Summary</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>Show Summary</span>
              </>
            )}
          </button>
          <button
            type="button"
            draggable
            onDragStart={handleAddDragStart}
            onDragEnd={() => setDragAddIndex(null)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
            title="Drag to add category"
            onClick={() => addCategoryAt(categories.length)}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Summary Section */}
      {isSummaryExpanded && (
        <div className="mb-6 p-4 bg-muted/5 rounded-lg border border-[#4DB6AC]/20">
          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700 dark:text-[#E5E7EB]">{category.name}</h3>
                  <div className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">
                    ${formatCurrency(calculateCategoryTotal(category))}
                  </div>
                </div>
                <div className="pl-4 space-y-2">
                  {category.fees.map(fee => (
                    <div key={fee.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-[#9CA3AF]">{fee.name}</div>
                        <div className="text-sm text-gray-600 dark:text-[#9CA3AF]">
                          {fee.subcomponents?.length ? (
                            <div className="flex flex-col items-end">
                              <div className="text-xs text-gray-500">Subtotal:</div>
                              <div>${formatCurrency(calculateSubcomponentsTotal(fee.subcomponents))}</div>
                            </div>
                          ) : fee.type === 'simple' ? (
                            <div>${formatCurrency((fee.amount || 0) * (fee.quantity || 1))}</div>
                          ) : fee.type === 'hourly' ? (
                            <div>${formatCurrency(fee.hours && fee.hourlyRate ? calculateTotal(fee.hourlyRate, fee.hours) : 0)}</div>
                          ) : null}
                        </div>
                      </div>
                      {fee.subcomponents?.map(sub => (
                        <div key={sub.id} className="pl-4 flex items-center justify-between">
                          <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">{sub.name}</div>
                          <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                            {sub.type === 'simple' ? (
                              <div>${formatCurrency((sub.amount || 0) * (sub.quantity || 1))}</div>
                            ) : sub.type === 'hourly' ? (
                              <div>${formatCurrency(sub.hours && sub.hourlyRate ? calculateTotal(sub.hourlyRate, sub.hours) : 0)}</div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Grand Total */}
            <div className="pt-4 mt-4 border-t border-[#4DB6AC]/20">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-700 dark:text-[#E5E7EB]">Grand Total</div>
                <div className="font-semibold text-gray-700 dark:text-[#E5E7EB]">
                  ${formatCurrency(categories.reduce((sum, category) => sum + calculateCategoryTotal(category), 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 min-h-[200px]">
        {categories.length === 0 ? (
          <div
            className="flex items-center justify-center h-[200px] text-gray-400 border-2 border-dashed border-gray-200 rounded-lg"
            onDragOver={e => {
              e.preventDefault();
              handleAddDragOver(0);
            }}
            onDrop={e => {
              e.preventDefault();
              handleAddDrop(0);
            }}
          >
            <div className="text-center">
              <FolderPlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Drag and drop to add a category here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, idx) => (
              <div
                key={category.id}
                className={`bg-card text-card-foreground dark:bg-[#374151] dark:text-[#E5E7EB] rounded-lg shadow p-6 border border-[#4DB6AC] dark:border-[#4DB6AC] ${
                  dragOverIndex === idx ? 'border-primary bg-primary/10' : ''
                } ${
                  dragAddIndex === idx ? 'border-dashed border-2 border-primary' : ''
                }`}
                draggable
                onDragStart={() => handleDragStart(category.id)}
                onDragOver={e => {
                  e.preventDefault();
                  if (draggedCategoryId) handleDragOver(idx);
                  if (dragAddIndex !== null) handleAddDragOver(idx);
                }}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedCategoryId) handleDrop(idx);
                  if (dragAddIndex !== null) handleAddDrop(idx);
                }}
                onDragEnd={() => {
                  setDraggedCategoryId(null);
                  setDragOverIndex(null);
                  setDragAddIndex(null);
                }}
              >
                {/* Category header */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Column 1: Category name */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {editingCategoryId === category.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCategoryName(category.id, editingCategoryName.trim() || 'Untitled Category');
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            } else if (e.key === 'Escape') {
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            }
                          }}
                          onBlur={() => {
                            updateCategoryName(category.id, editingCategoryName.trim() || 'Untitled Category');
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          }}
                          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-lg font-semibold dark:text-[#E5E7EB]"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold dark:text-[#E5E7EB] truncate">{category.name}</h2>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditingCategoryName(category.name);
                          }}
                          className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                          title="Edit Category Name"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Column 2: Empty space (removed category total) */}
                  <div className="min-w-[120px] flex justify-end">
                  </div>

                  {/* Column 3: Action buttons */}
                  <div className="min-w-[120px] flex justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addFee(category.id, category.fees.length)}
                        className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                        title="Add Fee Component"
                      >
                        <FilePlus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category.id)}
                        className="p-1.5 text-gray-500 hover:text-destructive"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fee components */}
                <div className="space-y-2 min-h-[200px] -mx-6">
                  {category.fees.map((fee, index) => (
                    <div 
                      key={fee.id} 
                      draggable
                      onDragStart={() => handleFeeDragStart(category.id, fee.id)}
                      onDragOver={(e) => handleFeeDragOver(e, category.id, index)}
                      onDrop={() => handleFeeDrop(category.id, index)}
                      onDragEnd={() => {
                        setDraggedFeeId(null);
                        setDragOverFeeIndex(null);
                      }}
                      className={`border-x-0 border-y-0 border-[#4DB6AC] dark:border-[#4DB6AC] overflow-hidden ${
                        index !== category.fees.length - 1 ? 'border-b' : ''
                      } ${
                        dragOverFeeIndex?.categoryId === category.id && 
                        dragOverFeeIndex?.index === index ? 
                        'border-dashed border-2 border-primary' : ''
                      }`}
                    >
                      <div className="p-4 bg-muted/5 hover:bg-muted/10 cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/5 rounded-md flex-shrink-0">
                            {fee.type === 'simple' ? (
                              <FileIcon className="w-6 h-6 text-primary" />
                            ) : fee.type === 'hourly' ? (
                              <FileClock className="w-6 h-6 text-primary" />
                            ) : (
                              <FileIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            {/* Name row */}
                            <div className="flex items-center justify-between w-full mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {editingFeeId === fee.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        ref={(input) => {
                                          if (input) {
                                            input.focus();
                                            // Only select text when first mounted
                                            if (editingFeeName === fee.name) {
                                              input.select();
                                            }
                                          }
                                        }}
                                        value={editingFeeName}
                                        onChange={e => setEditingFeeName(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            saveFeeName(category.id, fee.id);
                                          } else if (e.key === 'Escape') {
                                            setEditingFeeId(null);
                                            setEditingFeeName('');
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => saveFeeName(category.id, fee.id)}
                                        className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                        title="Save Name"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFeeId(null);
                                          setEditingFeeName('');
                                        }}
                                        className="p-1 text-gray-500 hover:text-destructive"
                                        title="Cancel"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-medium dark:text-[#E5E7EB]">{fee.name}</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingFeeId(fee.id);
                                          setEditingFeeName(fee.name);
                                        }}
                                        className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                        title="Edit Fee Component Name"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="min-w-[120px] flex justify-end">
                                  {/* Empty column to maintain layout */}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 w-[120px] justify-end">
                                  {!fee.subcomponents?.length ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setFeeType(category.id, fee.id, 'simple')}
                                        className={`p-1.5 rounded-md transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200 ${
                                          fee.type === 'simple' ? 'bg-primary/10 text-primary' : ''
                                        }`}
                                        title="Simple Fee"
                                      >
                                        <FileIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFeeType(category.id, fee.id, 'hourly')}
                                        className={`p-1.5 rounded-md transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200 ${
                                          fee.type === 'hourly' ? 'bg-primary/10 text-primary' : ''
                                        }`}
                                        title="Hourly Fee"
                                      >
                                        <FileClock className="w-4 h-4" />
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
                                    </>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => addSubcomponent(category.id, fee.id)}
                                    className="p-1.5 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                    title="Add Subcomponent"
                                  >
                                    <FilePlus2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategories(categories.map(cat =>
                                        cat.id === category.id
                                          ? {
                                              ...cat,
                                              fees: cat.fees.filter(f => f.id !== fee.id)
                                            }
                                          : cat
                                      ));
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-destructive"
                                    title="Delete Fee Component"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {/* Details row */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1 min-w-0">
                                {fee.type === 'simple' ? (
                                  <div className="flex items-center gap-1">
                                    {editingDescriptionId === fee.id ? (
                                      <div
                                        ref={descriptionInputRef}
                                        contentEditable
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[8ch]"
                                        onFocus={(e) => selectAllContent(e.currentTarget)}
                                        onBlur={() => {
                                          handleDescriptionEdit(category.id, fee.id, editingDescriptionValue);
                                          setEditingDescriptionId(null);
                                          setEditingDescriptionValue('');
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleDescriptionEdit(category.id, fee.id, editingDescriptionValue);
                                            setEditingDescriptionId(null);
                                            setEditingDescriptionValue('');
                                          } else if (e.key === 'Escape') {
                                            setEditingDescriptionId(null);
                                            setEditingDescriptionValue('');
                                          }
                                        }}
                                        onInput={(e) => setEditingDescriptionValue(e.currentTarget.textContent || '')}
                                        suppressContentEditableWarning
                                      >
                                        {fee.description || ''}
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => {
                                          setEditingDescriptionId(fee.id);
                                          setEditingDescriptionValue(fee.description || '');
                                          setTimeout(() => descriptionInputRef.current?.focus(), 0);
                                        }}
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                      >
                                        {fee.description || 'Add description'}
                                      </div>
                                    )}
                                    <span>•</span>
                                    {editingAmountId === fee.id ? (
                                      <div
                                        ref={amountInputRef}
                                        contentEditable
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[6ch]"
                                        onFocus={(e) => selectAllContent(e.currentTarget)}
                                        onBlur={() => {
                                          const value = parseRateInput(editingAmountValue);
                                          handleAmountEdit(category.id, fee.id, value);
                                          setEditingAmountId(null);
                                          setEditingAmountValue('');
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = parseRateInput(editingAmountValue);
                                            handleAmountEdit(category.id, fee.id, value);
                                            setEditingAmountId(null);
                                            setEditingAmountValue('');
                                          } else if (e.key === 'Escape') {
                                            setEditingAmountId(null);
                                            setEditingAmountValue('');
                                          }
                                        }}
                                        onInput={(e) => setEditingAmountValue(e.currentTarget.textContent || '')}
                                        suppressContentEditableWarning
                                      >
                                        {formatRateDisplay(fee.amount)}
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => {
                                          setEditingAmountId(fee.id);
                                          setEditingAmountValue(fee.amount.toString());
                                          setTimeout(() => amountInputRef.current?.focus(), 0);
                                        }}
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                      >
                                        {formatRateDisplay(fee.amount)}
                                      </div>
                                    )}
                                    <span>•</span>
                                    {editingQuantityId === fee.id ? (
                                      <div
                                        ref={quantityInputRef}
                                        contentEditable
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[2ch]"
                                        onFocus={(e) => selectAllContent(e.currentTarget)}
                                        onBlur={() => {
                                          const value = parseFloat(editingQuantityValue) || 0;
                                          handleQuantityEdit(category.id, fee.id, value);
                                          setEditingQuantityId(null);
                                          setEditingQuantityValue('');
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = parseFloat(editingQuantityValue) || 0;
                                            handleQuantityEdit(category.id, fee.id, value);
                                            setEditingQuantityId(null);
                                            setEditingQuantityValue('');
                                          } else if (e.key === 'Escape') {
                                            setEditingQuantityId(null);
                                            setEditingQuantityValue('');
                                          }
                                        }}
                                        onInput={(e) => setEditingQuantityValue(e.currentTarget.textContent || '')}
                                        suppressContentEditableWarning
                                      >
                                        {fee.quantity || 1}
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => {
                                          setEditingQuantityId(fee.id);
                                          setEditingQuantityValue((fee.quantity || 1).toString());
                                          setTimeout(() => quantityInputRef.current?.focus(), 0);
                                        }}
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                      >
                                        {fee.quantity || 1} {fee.quantity === 1 ? 'item' : 'items'}
                                      </div>
                                    )}
                                  </div>
                                ) : fee.type === 'hourly' ? (
                                  <div className="flex items-center gap-1">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none">
                                        {fee.discipline_id ? disciplines.find(d => d.id === fee.discipline_id)?.name : 'Select discipline'}
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {disciplines.map(discipline => (
                                          <DropdownMenuItem
                                            key={discipline.id}
                                            onClick={() => {
                                              setCategories(categories.map(cat =>
                                                cat.id === category.id
                                                  ? {
                                                      ...cat,
                                                      fees: cat.fees.map(f =>
                                                        f.id === fee.id
                                                          ? {
                                                              ...f,
                                                              subcomponents: f.subcomponents?.map(s =>
                                                                s.id === subcomponent.id
                                                                  ? {
                                                                      ...s,
                                                                      discipline_id: discipline.id,
                                                                      role_id: undefined,
                                                                      role_designation: undefined,
                                                                      hourlyRate: undefined,
                                                                      hours: undefined
                                                                    }
                                                                  : s
                                                              )
                                                            }
                                                          : f
                                                      ),
                                                    }
                                                  : cat
                                              ));
                                            }}
                                          >
                                            {discipline.name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span>•</span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none" disabled={!fee.discipline_id}>
                                        {fee.role_id ? roles.find(r => r.id === fee.role_id)?.name + (fee.role_designation ? ` (${fee.role_designation})` : '') : 'Select role'}
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {fee.discipline_id && getAvailableRoles(fee.discipline_id).map(({ role, designation }) => (
                                          <DropdownMenuItem
                                            key={`${role.id}-${designation}`}
                                            onClick={() => {
                                              updateSubWithRole(category.id, fee.id, subcomponent.id, role.id, designation);
                                            }}
                                          >
                                            {role.name}
                                            {designation ? ` (${designation})` : ''}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span>•</span>
                                    <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">{fee.hourlyRate ? `$${fee.hourlyRate}/hr` : 'No rate'}</span>
                                    <span>•</span>
                                    {editingHoursId === fee.id ? (
                                      <div
                                        ref={hoursInputRef}
                                        contentEditable
                                        className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[2ch]"
                                        onFocus={(e) => selectAllContent(e.currentTarget)}
                                        onBlur={() => handleHoursBlur(category.id, fee.id)}
                                        onKeyDown={(e) => handleHoursKeyDown(e, category.id, fee.id)}
                                        onInput={(e) => setEditingHoursValue(e.currentTarget.textContent || '')}
                                        suppressContentEditableWarning
                                      >
                                        {fee.hours || 0}
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => {
                                          if (fee.hourlyRate) {
                                            setEditingHoursId(fee.id);
                                            setEditingHoursValue(fee.hours?.toString() || '0');
                                            setTimeout(() => hoursInputRef.current?.focus(), 0);
                                          }
                                        }}
                                        className={`text-sm text-gray-500 dark:text-[#9CA3AF] ${fee.hourlyRate ? 'cursor-text' : ''}`}
                                      >
                                        {fee.hours || 0} hours
                                      </div>
                                    )}
                                  </div>
                                ) : fee.subcomponents?.length ? (
                                  <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                    Select fee type
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                    Select fee type
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB] min-w-[120px] flex justify-end">
                                  {fee.type === 'simple' ? (
                                    <div className="flex flex-col items-end">
                                      <div>${formatCurrency((fee.amount || 0) * (fee.quantity || 1))}</div>
                                    </div>
                                  ) : fee.type === 'hourly' ? (
                                    <div className="flex flex-col items-end">
                                      <div>${formatCurrency(fee.hours && fee.hourlyRate ? calculateTotal(fee.hourlyRate, fee.hours) : 0)}</div>
                                    </div>
                                  ) : fee.subcomponents?.length ? (
                                    <div className="flex flex-col items-end">
                                      <div className="text-xs text-gray-500">{fee.name} Subtotal:</div>
                                      <div className="font-semibold">${formatCurrency(calculateSubcomponentsTotal(fee.subcomponents))}</div>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="min-w-[120px] flex justify-end">
                                  {/* Additional column content can go here */}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Component fields */}
                      {fee.type === 'simple' && null}

                      {fee.type === 'hourly' && null}

                      {/* Subcomponents */}
                      {fee.subcomponents && fee.subcomponents.length > 0 && (
                        <div 
                          className={`bg-muted/5 ${
                            dragOverFeeId === fee.id ? 'border-2 border-dashed border-primary' : ''
                          }`}
                          onDragOver={(e) => handleSubDragOver(e, category.id, fee.id, fee.subcomponents?.length || 0)}
                          onDragLeave={(e) => handleSubDragLeave(e, fee.id)}
                          onDrop={(e) => handleSubDrop(e, category.id, fee.id, fee.subcomponents?.length || 0)}
                        >
                          {fee.subcomponents.map((subcomponent, subIndex) => (
                            <div 
                              key={subcomponent.id}
                              draggable
                              onDragStart={() => handleSubDragStart(category.id, fee.id, subcomponent.id)}
                              onDragOver={(e) => handleSubDragOver(e, category.id, fee.id, subIndex)}
                              onDrop={(e) => handleSubDrop(e, category.id, fee.id, subIndex)}
                              onDragEnd={() => {
                                setDraggedSubId(null);
                                setDragOverSubIndex(null);
                                setDragOverFeeId(null);
                              }}
                              className={`p-4 pl-12 ${
                                subIndex !== fee.subcomponents!.length - 1 ? 
                                'border-b border-[#4DB6AC]/10 dark:border-[#4DB6AC]/10' : ''
                              } ${
                                dragOverSubIndex?.categoryId === category.id && 
                                dragOverSubIndex?.feeId === fee.id && 
                                dragOverSubIndex?.index === subIndex ? 
                                'border-dashed border-2 border-primary' : ''
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-1.5 bg-primary/5 rounded-md flex-shrink-0">
                                  {subcomponent.type === 'simple' ? (
                                    <FileIcon className="w-4 h-4 text-primary/70" />
                                  ) : subcomponent.type === 'hourly' ? (
                                    <FileClock className="w-4 h-4 text-primary/70" />
                                  ) : (
                                    <FileIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  {/* Name row */}
                                  <div className="flex items-center justify-between w-full mb-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {editingSubId === subcomponent.id ? (
                                          <div className="flex items-center gap-2">
                                            <Input
                                              ref={(input) => {
                                                if (input) {
                                                  input.focus();
                                                  // Only select text when first mounted
                                                  if (editingSubName === subcomponent.name) {
                                                    input.select();
                                                  }
                                                }
                                              }}
                                              value={editingSubName}
                                              onChange={e => setEditingSubName(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  saveSubName(category.id, fee.id, subcomponent.id);
                                                } else if (e.key === 'Escape') {
                                                  setEditingSubId(null);
                                                  setEditingSubName('');
                                                }
                                              }}
                                              className="flex-1 px-2 py-1 border border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground dark:bg-[#374151] dark:text-[#E5E7EB]"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => saveSubName(category.id, fee.id, subcomponent.id)}
                                              className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                              title="Save Name"
                                            >
                                              <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSubId(null);
                                                setEditingSubName('');
                                              }}
                                              className="p-1 text-gray-500 hover:text-destructive"
                                              title="Cancel"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="font-medium dark:text-[#E5E7EB]">{subcomponent.name}</div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSubId(subcomponent.id);
                                                setEditingSubName(subcomponent.name);
                                              }}
                                              className="p-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded-md transition-colors"
                                              title="Edit Subcomponent Name"
                                            >
                                              <Pencil className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="min-w-[120px] flex justify-end">
                                        {/* Empty column to maintain layout */}
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0 w-[120px] justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setSubType(category.id, fee.id, subcomponent.id, 'simple')}
                                          className={`p-1.5 rounded-md transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200 ${
                                            subcomponent.type === 'simple' ? 'bg-primary/10 text-primary' : ''
                                          }`}
                                          title="Simple Fee"
                                        >
                                          <FileIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSubType(category.id, fee.id, subcomponent.id, 'hourly')}
                                          className={`p-1.5 rounded-md transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200 ${
                                            subcomponent.type === 'hourly' ? 'bg-primary/10 text-primary' : ''
                                          }`}
                                          title="Hourly Fee"
                                        >
                                          <FileClock className="w-4 h-4" />
                                        </button>
                                        <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCategories(categories.map(cat =>
                                              cat.id === category.id
                                                ? {
                                                    ...cat,
                                                    fees: cat.fees.map(f =>
                                                      f.id === fee.id
                                                        ? {
                                                            ...f,
                                                            subcomponents: f.subcomponents?.filter(s => s.id !== subcomponent.id)
                                                          }
                                                        : f
                                                    )
                                                  }
                                                : cat
                                            ));
                                          }}
                                          className="p-1.5 text-gray-500 hover:text-destructive"
                                          title="Delete Subcomponent"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Details row */}
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex-1 min-w-0">
                                      {subcomponent.type === 'simple' ? (
                                        <div className="flex items-center gap-1">
                                          {editingDescriptionId === subcomponent.id ? (
                                            <div
                                              ref={descriptionInputRef}
                                              contentEditable
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[8ch]"
                                              onFocus={(e) => selectAllContent(e.currentTarget)}
                                              onBlur={() => {
                                                handleSubDescriptionEdit(category.id, fee.id, subcomponent.id, editingDescriptionValue);
                                                setEditingDescriptionId(null);
                                                setEditingDescriptionValue('');
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleSubDescriptionEdit(category.id, fee.id, subcomponent.id, editingDescriptionValue);
                                                  setEditingDescriptionId(null);
                                                  setEditingDescriptionValue('');
                                                } else if (e.key === 'Escape') {
                                                  setEditingDescriptionId(null);
                                                  setEditingDescriptionValue('');
                                                }
                                              }}
                                              onInput={(e) => setEditingDescriptionValue(e.currentTarget.textContent || '')}
                                              suppressContentEditableWarning
                                            >
                                              {subcomponent.description || ''}
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => {
                                                setEditingDescriptionId(subcomponent.id);
                                                setEditingDescriptionValue(subcomponent.description || '');
                                                setTimeout(() => descriptionInputRef.current?.focus(), 0);
                                              }}
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                            >
                                              {subcomponent.description || 'Add description'}
                                            </div>
                                          )}
                                          <span>•</span>
                                          {editingAmountId === subcomponent.id ? (
                                            <div
                                              ref={amountInputRef}
                                              contentEditable
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[6ch]"
                                              onFocus={(e) => selectAllContent(e.currentTarget)}
                                              onBlur={() => {
                                                const value = parseRateInput(editingAmountValue);
                                                handleSubAmountEdit(category.id, fee.id, subcomponent.id, value);
                                                setEditingAmountId(null);
                                                setEditingAmountValue('');
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const value = parseRateInput(editingAmountValue);
                                                  handleSubAmountEdit(category.id, fee.id, subcomponent.id, value);
                                                  setEditingAmountId(null);
                                                  setEditingAmountValue('');
                                                } else if (e.key === 'Escape') {
                                                  setEditingAmountId(null);
                                                  setEditingAmountValue('');
                                                }
                                              }}
                                              onInput={(e) => setEditingAmountValue(e.currentTarget.textContent || '')}
                                              suppressContentEditableWarning
                                            >
                                              {formatRateDisplay(subcomponent.amount)}
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => {
                                                setEditingAmountId(subcomponent.id);
                                                setEditingAmountValue(subcomponent.amount.toString());
                                                setTimeout(() => amountInputRef.current?.focus(), 0);
                                              }}
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                            >
                                              {formatRateDisplay(subcomponent.amount)}
                                            </div>
                                          )}
                                          <span>•</span>
                                          {editingQuantityId === subcomponent.id ? (
                                            <div
                                              ref={quantityInputRef}
                                              contentEditable
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[2ch]"
                                              onFocus={(e) => selectAllContent(e.currentTarget)}
                                              onBlur={() => {
                                                const value = parseFloat(editingQuantityValue) || 0;
                                                handleSubQuantityEdit(category.id, fee.id, subcomponent.id, value);
                                                setEditingQuantityId(null);
                                                setEditingQuantityValue('');
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const value = parseFloat(editingQuantityValue) || 0;
                                                  handleSubQuantityEdit(category.id, fee.id, subcomponent.id, value);
                                                  setEditingQuantityId(null);
                                                  setEditingQuantityValue('');
                                                } else if (e.key === 'Escape') {
                                                  setEditingQuantityId(null);
                                                  setEditingQuantityValue('');
                                                }
                                              }}
                                              onInput={(e) => setEditingQuantityValue(e.currentTarget.textContent || '')}
                                              suppressContentEditableWarning
                                            >
                                              {subcomponent.quantity || 1}
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => {
                                                setEditingQuantityId(subcomponent.id);
                                                setEditingQuantityValue((subcomponent.quantity || 1).toString());
                                                setTimeout(() => quantityInputRef.current?.focus(), 0);
                                              }}
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] cursor-text"
                                            >
                                              {subcomponent.quantity || 1} {subcomponent.quantity === 1 ? 'item' : 'items'}
                                            </div>
                                          )}
                                        </div>
                                      ) : subcomponent.type === 'hourly' ? (
                                        <div className="flex items-center gap-1">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none">
                                              {subcomponent.discipline_id ? disciplines.find(d => d.id === subcomponent.discipline_id)?.name : 'Select discipline'}
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              {disciplines.map(discipline => (
                                                <DropdownMenuItem
                                                  key={discipline.id}
                                                  onClick={() => {
                                                    setCategories(categories.map(cat =>
                                                      cat.id === category.id
                                                        ? {
                                                            ...cat,
                                                            fees: cat.fees.map(f =>
                                                              f.id === fee.id
                                                                ? {
                                                                    ...f,
                                                                    subcomponents: f.subcomponents?.map(s =>
                                                                      s.id === subcomponent.id
                                                                        ? {
                                                                            ...s,
                                                                            discipline_id: discipline.id,
                                                                            role_id: undefined,
                                                                            role_designation: undefined,
                                                                            hourlyRate: undefined,
                                                                            hours: undefined
                                                                          }
                                                                        : s
                                                                    )
                                                                  }
                                                                : f
                                                            ),
                                                          }
                                                        : cat
                                                    ));
                                                  }}
                                                >
                                                  {discipline.name}
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                          <span>•</span>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none" disabled={!subcomponent.discipline_id}>
                                              {subcomponent.role_id ? roles.find(r => r.id === subcomponent.role_id)?.name + (subcomponent.role_designation ? ` (${subcomponent.role_designation})` : '') : 'Select role'}
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              {subcomponent.discipline_id && getAvailableRoles(subcomponent.discipline_id).map(({ role, designation }) => (
                                                <DropdownMenuItem
                                                  key={`${role.id}-${designation}`}
                                                  onClick={() => {
                                                    updateSubWithRole(category.id, fee.id, subcomponent.id, role.id, designation);
                                                  }}
                                                >
                                                  {role.name}
                                                  {designation ? ` (${designation})` : ''}
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                          <span>•</span>
                                          <span className="text-sm text-gray-500 dark:text-[#9CA3AF]">{subcomponent.hourlyRate ? `$${subcomponent.hourlyRate}/hr` : 'No rate'}</span>
                                          <span>•</span>
                                          {editingHoursId === subcomponent.id ? (
                                            <div
                                              ref={hoursInputRef}
                                              contentEditable
                                              className="text-sm text-gray-500 dark:text-[#9CA3AF] focus:outline-none min-w-[2ch]"
                                              onFocus={(e) => selectAllContent(e.currentTarget)}
                                              onBlur={() => handleSubHoursBlur(category.id, fee.id, subcomponent.id)}
                                              onKeyDown={(e) => handleSubHoursKeyDown(e, category.id, fee.id, subcomponent.id)}
                                              onInput={(e) => setEditingHoursValue(e.currentTarget.textContent || '')}
                                              suppressContentEditableWarning
                                            >
                                              {subcomponent.hours || 0}
                                            </div>
                                          ) : (
                                            <div
                                              onClick={() => {
                                                if (subcomponent.hourlyRate) {
                                                  setEditingHoursId(subcomponent.id);
                                                  setEditingHoursValue(subcomponent.hours?.toString() || '0');
                                                  setTimeout(() => hoursInputRef.current?.focus(), 0);
                                                }
                                              }}
                                              className={`text-sm text-gray-500 dark:text-[#9CA3AF] ${subcomponent.hourlyRate ? 'cursor-text' : ''}`}
                                            >
                                              {subcomponent.hours || 0} hours
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500 dark:text-[#9CA3AF]">
                                          Select fee type
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB] min-w-[120px] flex justify-end pr-4">
                                      {subcomponent.type === 'simple' ? (
                                        <div className="flex flex-col items-end">
                                          <div>${formatCurrency((subcomponent.amount || 0) * (subcomponent.quantity || 1))}</div>
                                        </div>
                                      ) : subcomponent.type === 'hourly' ? (
                                        <div className="flex flex-col items-end">
                                          <div>${formatCurrency(subcomponent.hours && subcomponent.hourlyRate ? calculateTotal(subcomponent.hourlyRate, subcomponent.hours) : 0)}</div>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="min-w-[120px] flex justify-end">
                                      {/* Third column content can go here */}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Drop zone at the end */}
        {dragAddIndex === categories.length && (
          <div
            className="border-dashed border-2 border-primary rounded p-3 text-center text-primary"
            onDragOver={e => {
              e.preventDefault();
              handleAddDragOver(categories.length);
            }}
            onDrop={e => {
              e.preventDefault();
              handleAddDrop(categories.length);
            }}
          >
            Drop to add category here
          </div>
        )}
      </div>
    </div>
  );
};

export default FlexFees; 