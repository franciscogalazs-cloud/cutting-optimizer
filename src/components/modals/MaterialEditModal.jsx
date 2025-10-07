import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export const MaterialEditModal = ({ open, onClose, material, onSave, units = 'mm' }) => {
  const [form, setForm] = useState({ length: 0, width: 0, quantity: 1, material: 'Melamina', kerf: 3, margin: 5 })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (material) {
      setForm({
        length: material.length ?? 0,
        width: material.width ?? 0,
        quantity: material.quantity ?? 1,
        material: material.material ?? 'Melamina',
        kerf: material.kerf ?? 3,
        margin: material.margin ?? 5,
      })
      setErrors({})
    }
  }, [material])

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e = {}
    if (!(form.length > 0)) e.length = 'Debe ser > 0'
    if (!(form.width > 0)) e.width = 'Debe ser > 0'
    if (!(form.kerf >= 0)) e.kerf = 'Debe ser >= 0'
    if (!(form.margin >= 0)) e.margin = 'Debe ser >= 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave?.({
      length: Number(form.length),
      width: Number(form.width),
      quantity: form.quantity, // Mantener la cantidad original, no editable
      material: form.material,
      kerf: Number(form.kerf),
      margin: Number(form.margin),
    })
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white" aria-describedby="material-edit-desc">
        <DialogHeader>
          <DialogTitle>Editar Material</DialogTitle>
          <DialogDescription id="material-edit-desc" className="sr-only">
            Formulario para editar dimensiones y parámetros del material seleccionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Largo ({units})</Label>
              <Input type="number" step="0.1" min="0" value={form.length} onChange={e => setField('length', e.target.value)} />
              {errors.length && <p className="text-xs text-red-600 mt-1">{errors.length}</p>}
            </div>
            <div>
              <Label>Ancho ({units})</Label>
              <Input type="number" step="0.1" min="0" value={form.width} onChange={e => setField('width', e.target.value)} />
              {errors.width && <p className="text-xs text-red-600 mt-1">{errors.width}</p>}
            </div>
          </div>
          {/* Se oculta la cantidad; se calcula automáticamente durante la optimización. */}
          
          {/* Precio eliminado del modal. Se define directamente en Presupuesto. */}
          <div>
            <Label>Material</Label>
            <Input value={form.material} onChange={e => setField('material', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grosor sierra ({units})</Label>
              <Input type="number" step="0.1" min="0" value={form.kerf} onChange={e => setField('kerf', e.target.value)} />
              {errors.kerf && <p className="text-xs text-red-600 mt-1">{errors.kerf}</p>}
            </div>
            <div>
              <Label>Margen ({units})</Label>
              <Input type="number" step="0.1" min="0" value={form.margin} onChange={e => setField('margin', e.target.value)} />
              {errors.margin && <p className="text-xs text-red-600 mt-1">{errors.margin}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

