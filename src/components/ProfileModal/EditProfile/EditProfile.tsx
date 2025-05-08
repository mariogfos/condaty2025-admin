import Input from '@/mk/components/forms/Input/Input'
import DataModal from '@/mk/components/ui/DataModal/DataModal'
import React, { useState } from 'react'
import styles from './EditProfile.module.css'
import { Avatar } from '@/mk/components/ui/Avatar/Avatar'
import { IconCamera, IconImage } from '@/components/layout/icons/IconsBiblioteca'
import { getFullName, getUrlImages } from '@/mk/utils/string'
import Button from '@/mk/components/forms/Button/Button'

const EditProfile = ({open,onClose,formState, urlImages,errors}:any) => {
    const [preview, setPreview] = useState<string | null>(null);
  

    const getAvatarUrl = () => {
        // Si hay una vista previa (al subir nueva imagen), usamos esa
        if (preview) {
          return preview;
        }
        // Si no, generamos la URL con la función getUrlImages
        return' getUrlImages(`/ADM-${user?.id}.webp?d=${user?.updated_at}`);'
      };
  return (
    <DataModal 
    title={'Editar'}
    open={open}
    onClose={onClose}
    buttonText=""
    buttonCancel=""  
    // style={{minWidth:600}}
    >

    <div className={styles.EditProfile}>  
    <section>
    <Avatar
            name={'getFullName(user)'}
            src={getAvatarUrl()}
            w={320}
            h={320}
            className={styles.modalAvatar}
          >
            <label
              htmlFor="imagePerfil"
              className={styles.imageButton}
            >
              <IconImage className={styles.imageIcon} size={72} />
            <p style={{overflow:'visible',color:'var(--cAccent)'}}>Cambiar foto</p>
            </label>
            
          </Avatar>
    </section>      
    <section>
        <div>
        <Input 
        label="Nombre"
        name="name"
        type="text"
        value={formState.name}
        //    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
        error={errors.name}
        />
        <Input
        label="Segundo nombre"
        name="middleName"
        type="text"
        value={formState.middleName}
        //    onChange={(e) => setFormState({...formState, middleName: e.target.value })}
        error={errors.middleName}
        />
        <Input
        label="Apellido paterno"
        name="last_name"
        type="text"
        value={formState.last_name}
        //    onChange={(e) => setFormState({...formState, last_name: e.target.value })}
        error={errors.last_name}
        />
        <Input 
        label="Apellido materno"
        name="motherLastName"
        type="text"
        value={formState.secondLastName}
        //    onChange={(e) => setFormState({...formState, secondLastName: e.target.value })}
        error={errors.secondLastName}
        />
        <Input
        label="Carnet de identidad"
        name="ci"
        type="text"
        value={formState.ci}
        //    onChange={(e) => setFormState({...formState, ci: e.target.value })}
        error={errors.ci}
        />
        <Input
        label="Teléfono"
        name="phone"
        type="text"
        value={formState.phone}
        //    onChange={(e) => setFormState({...formState, phone: e.target.value })}
        error={errors.phone}
        />
        </div>
        <Input
            label="Dirección"
            name="address"
            type="text"
            value={formState.address}
            //    onChange={(e) => setFormState({...formState, address: e.target.value })}
            error={errors.address}
            />
       <div>
         <div>
          <Button onClick={()=>{}} style={{width:100}}variant='secondary'>Cancelar</Button>
          <Button onClick={()=>{}}variant='primary'>Guardar Cambios</Button>
         </div>
       </div>     
    </section>
    </div>   
    </DataModal>
  )
}

export default EditProfile