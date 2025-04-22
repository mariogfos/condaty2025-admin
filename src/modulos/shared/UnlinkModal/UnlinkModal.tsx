import DataModal from '@/mk/components/ui/DataModal/DataModal'
import React from 'react'

const UnlinkModal = ({open,onClose, modName}:any) => {
    // console.log(props, "props")
  return (
    <DataModal open={open} onClose={onClose} title={'Desvincular ' + modName} buttonText="Desvincular" buttonCancel="">
    <h2>¿Estás seguro de eliminar el {modName}?</h2>
    <p>
    Recuerda que al momento de eliminar ya no podrás recuperarla.
    </p>
  </DataModal>
  )
}

export default UnlinkModal