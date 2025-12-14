import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coffee } from "lucide-react";

interface BuyMeACoffeeModalProps {
  qrCodePath?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonClassName?: string;
}

export const BuyMeACoffeeModal = ({
  qrCodePath = "/qr.jpg",
  title = "Buy me a coffee",
  description = "Scan the QR code to support this project. Thank you for your generosity!",
  buttonText = "Buy me a coffee",
  buttonVariant = "outline",
  buttonClassName = "flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50",
}: BuyMeACoffeeModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          className={buttonClassName}
        >
          <Coffee className="w-4 h-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-orange-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={qrCodePath}
              alt="QR Code for Buy me a coffee"
              className="w-64 h-64 object-contain"
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Scan with your phone to make a donation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

