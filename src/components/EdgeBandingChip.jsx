import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EdgeBandingModal } from '@/components/modals/EdgeBandingModal';
import { Plus } from 'lucide-react';

export const EdgeBandingChip = ({ 
  piece, 
  onSave, 
  className = "",
  variant = "outline",
  size = "sm" 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (updatedPiece) => {
    if (onSave) {
      onSave(updatedPiece);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Plus className="h-4 w-4" />
        Agregar tapacantos
      </Button>

      <EdgeBandingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        piece={piece}
        onSave={handleSave}
        title="Configurar Tapacantos"
      />
    </>
  );
};