import React from "react";
import { Croissant, Wine, Cake } from "lucide-react";
import { cn } from "../../../utils/utils";

interface DecorationProps {
  className?: string;
}

export const CroissantIcon: React.FC<DecorationProps> = ({ className }) => {
  return (
    <div className={cn("text-amber-600", className)}>
      <Croissant size={28} />
    </div>
  );
};

export const CakeIcon: React.FC<DecorationProps> = ({ className }) => {
  return (
    <div className={cn("text-amber-700", className)}>
      <Cake size={32} />
    </div>
  );
};

export const WineIcon: React.FC<DecorationProps> = ({ className }) => {
  return (
    <div className={cn("text-red-600", className)}>
      <Wine size={24} />
    </div>
  );
};

const FrenchDecoration: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left croissant */}
      <CroissantIcon className="absolute top-4 left-4 opacity-50" />
      
      {/* Top right wine */}
      <WineIcon className="absolute top-4 right-4 opacity-50" />
      
      {/* Bottom left cake */}
      <CakeIcon className="absolute bottom-4 left-4 opacity-50" />
      
      {/* Bottom right croissant */}
      <CroissantIcon className="absolute bottom-4 right-4 opacity-50" />
    </div>
  );
};

export default FrenchDecoration;