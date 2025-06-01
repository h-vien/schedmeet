import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeRangeSelectorProps {
  startTime: string;
  endTime: string;
  onTimeChange: (timeRange: { start: string; end: string }) => void;
}

const TimeRangeSelector = ({
  startTime,
  endTime,
  onTimeChange,
}: TimeRangeSelectorProps) => {
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        const displayTime = new Date(
          `2000-01-01T${timeString}`
        ).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleStartTimeChange = (value: string) => {
    onTimeChange({ start: value, end: endTime });
  };

  const handleEndTimeChange = (value: string) => {
    onTimeChange({ start: startTime, end: value });
  };

  return (
    <div className='space-y-6'>
      {/* Traditional Select Inputs */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Start Time</Label>
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

        <div className='space-y-2'>
          <Label className='text-sm font-medium'>End Time</Label>
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
    </div>
  );
};

export default TimeRangeSelector;
