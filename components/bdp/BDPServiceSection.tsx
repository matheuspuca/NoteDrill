"use client"

import { useFieldArray, Control, UseFormRegister, UseFormWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, MapPin } from "lucide-react"
import { BDPSchema } from "@/lib/schemas-bdp"

interface BDPServiceSectionProps {
    control: Control<BDPSchema>
    register: UseFormRegister<BDPSchema>
    watch: UseFormWatch<BDPSchema>
    index: number
    serviceType: string
    onRemoveService: (index: number) => void
}

export function BDPServiceSection({ control, register, watch, index, serviceType, onRemoveService }: BDPServiceSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `services.${index}.holes`
    })

    const holeCount = watch(`services.${index}.holeCount`)

    const handleGenerateHoles = () => {
        const count = Number(holeCount) || 0
        if (count <= 0) return

        // Get current last hole number across ALL services to maintain sequence?
        // Or just local sequence? Ideally global sequence but that's complex to track across services dynamically.
        // Let's assume user inputs numbers or we auto-increment based on current length of this section for now.
        // Better: just append 'count' new rows.

        const newHoles = Array.from({ length: count }).map((_, i) => ({
            holeNumber: fields.length + i + 1,
            depth: 0,
            subDrilling: 0,
        }))
        append(newHoles)
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h4 className="text-xl font-bold text-slate-800">{serviceType}</h4>
                <Button variant="ghost" size="sm" onClick={() => onRemoveService(index)} className="text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> Remover Serviço
                </Button>
            </div>

            {/* Config & Generation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Header Params */}
                <div className="flex gap-2">
                    <FormField control={control} name={`services.${index}.meshLength`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-slate-500">Afast. (m)</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="decimal" step="0.1" placeholder="0.0" className="bg-white h-8 text-sm" {...field} />
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField control={control} name={`services.${index}.meshWidth`} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-slate-500">Espaç. (m)</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="decimal" step="0.1" placeholder="0.0" className="bg-white h-8 text-sm" {...field} />
                            </FormControl>
                        </FormItem>
                    )} />
                </div>

                <FormField control={control} name={`services.${index}.diameter`} render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs text-slate-500">Diâmetro (pol)</FormLabel>
                        <FormControl>
                            <Input type="number" inputMode="decimal" step="0.1" placeholder="0.0" className="bg-white h-8 text-sm" {...field} />
                        </FormControl>
                    </FormItem>
                )} />

                <FormField control={control} name={`services.${index}.angle`} render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs text-slate-500">Ângulo (°)</FormLabel>
                        <FormControl>
                            <Input type="number" inputMode="decimal" step="0.1" placeholder="0" className="bg-white h-8 text-sm" {...field} />
                        </FormControl>
                    </FormItem>
                )} />

                <FormField control={control} name={`services.${index}.azimuth`} render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs text-slate-500">Azimute (°)</FormLabel>
                        <FormControl>
                            <Input type="number" inputMode="decimal" step="0.1" placeholder="0" className="bg-white h-8 text-sm" {...field} />
                        </FormControl>
                    </FormItem>
                )} />

                {/* Count & Action */}
                <div className="flex items-end gap-2">
                    <FormField control={control} name={`services.${index}.holeCount`} render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="text-xs text-slate-500 font-bold">Qtd. Furos</FormLabel>
                            <FormControl>
                                <Input type="number" inputMode="numeric" min={0} className="bg-white h-8 font-bold" {...field} />
                            </FormControl>
                        </FormItem>
                    )} />
                    <Button type="button" size="sm" onClick={handleGenerateHoles} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8">
                        Gerar
                    </Button>
                </div>
            </div>


            {/* Hole Table */}
            {fields.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <Table>
                        <TableHeader className="bg-slate-100">
                            <TableRow>
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead>ID Furo</TableHead>
                                <TableHead>Coords (Lat/Long)</TableHead>
                                <TableHead>Altura Perfurada (m)</TableHead>
                                <TableHead>Subfuração (m)</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, k) => (
                                <TableRow key={field.id} className="hover:bg-slate-50">
                                    <TableCell className="text-center font-bold text-slate-400">{k + 1}</TableCell>
                                    <TableCell>
                                        <Input {...register(`services.${index}.holes.${k}.holeNumber`)} type="number" inputMode="numeric" className="w-20 font-bold" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 w-48">
                                            <Input {...register(`services.${index}.holes.${k}.latitude`)} inputMode="decimal" placeholder="Lat" className="text-xs w-1/2" />
                                            <Input {...register(`services.${index}.holes.${k}.longitude`)} inputMode="decimal" placeholder="Long" className="text-xs w-1/2" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input {...register(`services.${index}.holes.${k}.depth`)} type="number" inputMode="decimal" step="0.1" className="w-24 font-bold text-blue-600" />
                                    </TableCell>
                                    <TableCell>
                                        <Input {...register(`services.${index}.holes.${k}.subDrilling`)} type="number" inputMode="decimal" step="0.1" placeholder="0.0" className="w-20 text-slate-500" />
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)} className="text-red-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
