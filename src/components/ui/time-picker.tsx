import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

const formatTimeValue = (value: string) => {
  return value.padStart(5, ' ');
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  pickerId?: string;
}

export function TimePicker({ value, onChange, className, pickerId = 'unknown' }: TimePickerProps) {
  console.log(`TimePicker (${pickerId}) rendered, value:`, value);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Sync inputValue with value prop when it changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Generate time options in 15-minute increments
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return options;
  }, []);

  // Focus the scroll container and log scroll events
  React.useEffect(() => {
    if (open && scrollContainerRef.current) {
      let focusAttempts = 0;
      const maxFocusAttempts = 5;
      const attemptFocus = () => {
        if (scrollContainerRef.current) {
          console.log(`TimePicker (${pickerId}) Attempting to focus scroll container, attempt ${focusAttempts + 1}`);
          scrollContainerRef.current.focus();
          if (document.activeElement === scrollContainerRef.current) {
            console.log(`TimePicker (${pickerId}) Focused scroll container`);
          } else if (focusAttempts < maxFocusAttempts) {
            focusAttempts++;
            setTimeout(attemptFocus, 100);
          } else {
            console.error(`TimePicker (${pickerId}) Failed to focus scroll container after ${maxFocusAttempts} attempts`);
          }
        }
      };
      attemptFocus();

      const handleWheel = (e: WheelEvent) => {
        console.log(`TimePicker (${pickerId}) Wheel event, deltaY:`, e.deltaY);
        e.preventDefault();
        scrollContainerRef.current!.scrollBy({
          top: e.deltaY,
          behavior: 'smooth',
        });
      };

      scrollContainerRef.current.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        scrollContainerRef.current?.removeEventListener('wheel', handleWheel);
      };
    }
  }, [open, pickerId]);

  // Scroll to selected item when popover opens
  React.useLayoutEffect(() => {
    console.log(`TimePicker (${pickerId}) useLayoutEffect triggered, open:`, open, 'value:', value);
    if (!open) {
      console.log(`TimePicker (${pickerId}) Skipped scroll: open=false`);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const attemptScroll = () => {
      console.log(`TimePicker (${pickerId}) Attempt ${attempts + 1}, scrollContainer:`, scrollContainerRef.current);

      if (scrollContainerRef.current) {
        console.log(`TimePicker (${pickerId}) Popover opened, attempting to scroll to:`, value);
        const targetElement = scrollContainerRef.current.querySelector(`[data-value="${value}"]`);
        console.log(`TimePicker (${pickerId}) Target element:`, targetElement);

        if (targetElement) {
          try {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            console.log(`TimePicker (${pickerId}) scrollIntoView executed`);
          } catch (error) {
            console.error(`TimePicker (${pickerId}) scrollIntoView failed:`, error);
            const itemTop = targetElement.offsetTop;
            const itemHeight = targetElement.offsetHeight;
            const containerHeight = scrollContainerRef.current!.offsetHeight;
            const scrollPosition = itemTop - (containerHeight - itemHeight) / 2;
            scrollContainerRef.current!.scrollTop = scrollPosition;
            console.log(`TimePicker (${pickerId}) Fallback scroll executed, scrollTop:`, scrollPosition);
          }
        } else {
          console.error(`TimePicker (${pickerId}) No target element found for scrolling`);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        console.log(`TimePicker (${pickerId}) Scroll container not ready, retrying...`);
        setTimeout(attemptScroll, 200);
      } else {
        console.error(`TimePicker (${pickerId}) Max attempts reached, scroll container not found`);
      }
    };

    attemptScroll();
  }, [open, value, pickerId]);

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (!newValue) {
      setInputValue('');
      return;
    }

    newValue = newValue.replace(/[^\d:]/g, '');

    if (newValue.length <= 2) {
      setInputValue(newValue);
    } else {
      const [hours, minutes] = newValue.split(':');
      if (hours && minutes) {
        const h = Math.min(parseInt(hours), 23);
        const m = Math.min(parseInt(minutes), 59);
        setInputValue(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      } else {
        const h = Math.min(parseInt(newValue.slice(0, 2)), 23);
        const m = Math.min(parseInt(newValue.slice(2, 4) || '0'), 59);
        setInputValue(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
  };

  // Handle blur event to format incomplete input
  const handleBlur = () => {
    if (!inputValue) {
      setInputValue(value);
      return;
    }

    const [hours, minutes] = inputValue.split(':');
    const h = Math.min(parseInt(hours || '0'), 23);
    const m = Math.min(parseInt(minutes || '0'), 59);
    const formattedValue = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setInputValue(formattedValue);
    onChange(formattedValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="HH:mm"
            className="w-full border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
          />
          <Clock className="h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          className="max-h-[500px] min-h-[300px] overflow-y-auto bg-background focus:outline-none scroll-smooth"
          onWheel={(e) => {
            e.preventDefault();
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({
                top: e.deltaY,
                behavior: 'smooth'
              });
            }
          }}         
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.focus();
              console.log(`TimePicker (${pickerId}) Focused scroll container on click`);
            }
          }}
        >
          {timeOptions.map((time) => (
            <div
              key={time.value}
              data-value={time.value}
              className={cn(
                "px-4 py-2 font-mono text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                time.value === value && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                setInputValue(time.value);
                onChange(time.value);
                setOpen(false);
              }}
            >
              {formatTimeValue(time.label)}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}