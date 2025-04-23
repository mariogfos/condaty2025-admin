import DataModal from '@/mk/components/ui/DataModal/DataModal'
import React from 'react'
import useAxios from '@/mk/hooks/useAxios'
import { useAuth } from '@/mk/contexts/AuthProvider'

const UnlinkModal = ({open, onClose, mod, item ,reLoad}:any) => {
  // console.log(item,'itetetem',mod,'ss',reLoad)
  const { execute } = useAxios()
  const { showToast } = useAuth()

  const onSave = async () => {
    if (!mod) return

    try {
      const { data: response } = await execute(
        `/${mod.modulo}/${item.id}`,
        'DELETE',
        {}
      )

      if (response?.success) {
        showToast(`${mod.singular.toLowerCase()} desvinculado exitosamente`, 'success')
        await reLoad()
        onClose()
      } else {
        showToast(response?.message || `Error al desvincular ${mod.singular.toLowerCase()}`, 'error')
      }
    } catch (error) {
      showToast(`Error al desvincular ${mod.singular.toLowerCase()}`, 'error')
      console.error('Error:', error)
    }
  }

  return (
    <DataModal 
      open={open} 
      onClose={onClose} 
      title={`Desvincular ${mod.singular.toLowerCase()}`} 
      buttonText="Desvincular" 
      buttonCancel="" 
      onSave={onSave}
    >
      <h2>¿Estás seguro de eliminar el {mod.singular.toLowerCase()}?</h2>
      <p>
        Recuerda que al momento de eliminar esta información ya no podrás recuperarla.
      </p>
    </DataModal>
  )
}

export default UnlinkModal