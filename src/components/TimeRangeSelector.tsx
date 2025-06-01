
import { useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeRangeSelectorProps {
  startTime: string;
  endTime: string;
  onTimeChange: (timeRange: { start: string; end: string }) => void;
}

const TimeRangeSelector = ({ startTime, endTime, onTimeChange }: TimeRangeSelectorProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const getTimeIndex = (timeValue: string) => {
    return timeOptions.findIndex(option => option.value === timeValue);
  };

  const isTimeInRange = (timeValue: string) => {
    const startIndex = getTimeIndex(startTime);
    const endIndex = getTimeIndex(endTime);
    const currentIndex = getTimeIndex(timeValue);
    
    if (startIndex === -1 || endIndex === -1 || currentIndex === -1) return false;
    
    return currentIndex >= startIndex && currentIndex <= endIndex;
  };

  const handleMouseDown = (timeValue: string) => {
    setIsDragging(true);
    setDragStartTime(timeValue);
    onTimeChange({ start: timeValue, end: timeValue });
  };

  const handleMouseEnter = useCallback((timeValue: string) => {
    if (!isDragging || !dragStartTime) return;

    const startIndex = getTimeIndex(dragStartTime);
    const currentIndex = getTimeIndex(timeValue);
    
    if (startIndex === -1 || currentIndex === -1) return;

    if (currentIndex >= startIndex) {
      onTimeChange({ start: dragStartTime, end: timeValue });
    } else {
      onTimeChange({ start: timeValue, end: dragStartTime });
    }
  }, [isDragging, dragStartTime, onTimeChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartTime("");
  };

  const handleStartTimeChange = (value: string) => {
    onTimeChange({ start: value, end: endTime });
  };

  const handleEndTimeChange = (value: string) => {
    onTimeChange({ start: startTime, end: value });
  };

  return (
    <div className="space-y-6">
      {/* Traditional Select Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Time</Label>
          <Select value={startTime} onValueChange={handleStartTimeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">End Time</Label>
          <Select value={endTime} onValueChange={handleEndTimeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drag and Drop Time Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Or drag to select time range:</Label>
        <div 
          ref={containerRef}
          className="border rounded-lg p-4 bg-gray-50 select-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1">
            {timeOptions.map((time) => (
              <div
                key={time.value}
                className={`
                  relative p-2 text-xs text-center cursor-pointer rounded transition-all duration-150 hover:scale-105
                  ${isTimeInRange(time.value) 
                    ? 'bg-blue-500 text-white border-2 border-blue-600' 
                    : 'bg-white border border-gray-200 hover:bg-gray-100'
                  }
                  ${isDragging ? 'pointer-events-none' : ''}
                `}
                onMouseDown={() => handleMouseDown(time.value)}
                onMouseEnter={() => handleMouseEnter(time.value)}
              >
                <div className="font-medium">
                  {new Date(`2000-01-01T${time.value}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    hour12: true
                  })}
                </div>
                <div className="text-[10px] opacity-75">
                  {new Date(`2000-01-01T${time.value}`).toLocaleTimeString('en-US', {
                    minute: '2-digit'
                  }).slice(-2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-600 text-center">
            Click and drag to select your preferred time range
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeSelector;
