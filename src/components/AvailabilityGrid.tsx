
import { useState, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AvailabilityGridProps {
  dates: string[];
  timeSlots: string[];
  responses: Record<string, Record<string, boolean>>;
  userAvailability: Record<string, boolean>;
  onAvailabilityChange: (availability: Record<string, boolean>) => void;
}

const ItemType = 'TIME_SLOT';

interface TimeSlotProps {
  dateStr: string;
  timeSlot: string;
  isSelected: boolean;
  count: number;
  totalParticipants: number;
  availableUsers: string[];
  onToggle: (dateStr: string, timeSlot: string) => void;
  onDragSelect: (dateStr: string, timeSlot: string, isSelecting: boolean) => void;
}

const TimeSlot = ({ 
  dateStr, 
  timeSlot, 
  isSelected, 
  count, 
  totalParticipants, 
  availableUsers,
  onToggle,
  onDragSelect
}: TimeSlotProps) => {
  const slotKey = `${dateStr}_${timeSlot}`;

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { slotKey, isSelecting: !isSelected },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { slotKey: string; isSelecting: boolean }) => {
      onDragSelect(dateStr, timeSlot, item.isSelecting);
    },
    hover: (item: { slotKey: string; isSelecting: boolean }) => {
      onDragSelect(dateStr, timeSlot, item.isSelecting);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getHeatmapColor = (count: number, total: number, isUserSelected: boolean) => {
    if (total === 0) return 'bg-gray-50 hover:bg-gray-100';
    
    const ratio = count / total;
    
    if (isUserSelected) {
      if (ratio >= 0.8) return 'bg-green-600 border-green-700';
      if (ratio >= 0.6) return 'bg-green-500 border-green-600';
      if (ratio >= 0.4) return 'bg-green-400 border-green-500';
      if (ratio >= 0.2) return 'bg-green-300 border-green-400';
      return 'bg-green-200 border-green-300';
    }
    
    if (ratio >= 0.8) return 'bg-green-500 hover:bg-green-600';
    if (ratio >= 0.6) return 'bg-green-400 hover:bg-green-500';
    if (ratio >= 0.4) return 'bg-green-300 hover:bg-green-400';
    if (ratio >= 0.2) return 'bg-green-200 hover:bg-green-300';
    if (ratio > 0) return 'bg-green-100 hover:bg-green-200';
    return 'bg-gray-50 hover:bg-gray-100';
  };

  const formatTimeSlot = (timeSlot: string) => {
    return format(parse(timeSlot, 'HH:mm', new Date()), 'h a');
  };

  const heatmapColor = getHeatmapColor(count, totalParticipants, isSelected);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={(node) => drag(drop(node))}
          className={cn(
            "h-16 cursor-pointer transition-all duration-200 border-r border-gray-200 last:border-r-0 flex items-center justify-center relative",
            heatmapColor,
            isSelected && "ring-2 ring-green-600 ring-inset",
            isDragging && "opacity-50",
            isOver && "ring-2 ring-blue-400"
          )}
          onClick={() => onToggle(dateStr, timeSlot)}
        >
          {isSelected && (
            <div className="absolute inset-0 border-2 border-dashed border-green-800 m-1 rounded"></div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="text-sm">
          <div className="font-medium mb-1">
            {format(new Date(dateStr), 'EEE, MMM d')} at {formatTimeSlot(timeSlot)}
          </div>
          {count > 0 ? (
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {count} of {totalParticipants} available:
              </div>
              <div className="space-y-1">
                {availableUsers.map(user => (
                  <div key={user} className="text-xs">
                    • {user}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              No one available
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const AvailabilityGrid = ({
  dates,
  timeSlots,
  responses,
  userAvailability,
  onAvailabilityChange
}: AvailabilityGridProps) => {
  const getSlotKey = (dateStr: string, timeSlot: string) => `${dateStr}_${timeSlot}`;

  const getAvailabilityData = (dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const availableUsers: string[] = [];
    let count = 0;
    
    Object.entries(responses).forEach(([userName, userResponse]) => {
      if (userResponse[slotKey]) {
        count++;
        availableUsers.push(userName);
      }
    });
    
    return { count, availableUsers };
  };

  const getTotalParticipants = () => Object.keys(responses).length;

  const handleSlotToggle = useCallback((dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const newAvailability = {
      ...userAvailability,
      [slotKey]: !userAvailability[slotKey]
    };
    onAvailabilityChange(newAvailability);
  }, [userAvailability, onAvailabilityChange]);

  const handleDragSelect = useCallback((dateStr: string, timeSlot: string, isSelecting: boolean) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const newAvailability = {
      ...userAvailability,
      [slotKey]: isSelecting
    };
    onAvailabilityChange(newAvailability);
  }, [userAvailability, onAvailabilityChange]);

  const formatTimeSlot = (timeSlot: string) => {
    return format(parse(timeSlot, 'HH:mm', new Date()), 'h a');
  };

  const totalParticipants = getTotalParticipants();

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider>
        <div className="overflow-auto bg-white">
          <div className="border border-gray-200 rounded-lg">
            {/* Header Row */}
            <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `100px repeat(${dates.length}, 1fr)` }}>
              <div className="p-4 bg-gray-50 border-r border-gray-200"></div>
              {dates.map((dateStr, index) => (
                <div key={index} className="p-4 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
                  <div className="font-medium text-gray-900">
                    {format(new Date(dateStr), 'MMM d')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(dateStr), 'EEE')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <div 
                key={timeSlot} 
                className={cn(
                  "grid border-b border-gray-200 last:border-b-0",
                  timeIndex % 2 === 0 ? "bg-gray-25" : "bg-white"
                )}
                style={{ gridTemplateColumns: `100px repeat(${dates.length}, 1fr)` }}
              >
                {/* Time Label */}
                <div className="p-4 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center">
                  {formatTimeSlot(timeSlot)}
                </div>
                
                {/* Date Slots */}
                {dates.map((dateStr, dateIndex) => {
                  const slotKey = getSlotKey(dateStr, timeSlot);
                  const isUserSelected = userAvailability[slotKey];
                  const { count, availableUsers } = getAvailabilityData(dateStr, timeSlot);
                  
                  return (
                    <TimeSlot
                      key={slotKey}
                      dateStr={dateStr}
                      timeSlot={timeSlot}
                      isSelected={isUserSelected}
                      count={count}
                      totalParticipants={totalParticipants}
                      availableUsers={availableUsers}
                      onToggle={handleSlotToggle}
                      onDragSelect={handleDragSelect}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">How to use:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-600 border-2 border-dashed border-green-800 rounded"></div>
                <span>Your selection (dashed border)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>High availability (many people available)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span>Low availability (few people available)</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Click to select individual slots, or drag across multiple slots to select them all at once. Hover over any slot to see who's available.
            </p>
          </div>
        </div>
      </TooltipProvider>
    </DndProvider>
  );
};

export default AvailabilityGrid;
