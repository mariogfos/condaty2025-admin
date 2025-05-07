import DataModal from '@/mk/components/ui/DataModal/DataModal'
import { useAuth } from '@/mk/contexts/AuthProvider';
import React from 'react'
import { IconAdmin, IconEdit, IconEmail, IconPhone, IconTrash, IconUser } from '../layout/icons/IconsBiblioteca';
import styles from './ProfileModal.module.css'
import WidgetBase from '../Widgets/WidgetBase/WidgetBase';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';

interface ProfileModalProps {
    open:boolean;
    onClose:any;
    dataID?:string | number;
    titleBack?:string;
    title?:string;
    edit?:boolean;
    del?:boolean;
    type?:string;

}
const ProfileModal = ({
    open,
    onClose,
    titleBack ="Volver", 
    title='Mi Perfil',
    edit = true,
    del = true,
    type

}:ProfileModalProps) => {
    const { user } = useAuth();
    const client = user?.clients?.filter(
        (item: any) => item?.id === user?.client_id
      )[0];
    const IconType = type === 'admin' ? <IconAdmin color={'var(--cAccent)'} size={16}/> : <IconUser color={'var(--cWhiteV1)'} size={32}/>;

  return (
    <DataModal
    title={titleBack}
    open={open}
    onClose={onClose}
    fullScreen
    variant="V2"
    // buttonText="Cerrar sesión"
    // buttonCancel="Cancelar"
    // onSave={() => logout()}
  >
    <div className={styles.ProfileModal}>
      <section>  
      <h1>{title}</h1>
      <div>
    {edit &&  <IconEdit className='' square size={32} color={'var(--cWhite)'} style={{backgroundColor:'var(--cWhiteV2)'}}/>}
    {del &&  <IconTrash className='' square size={32} color={'var(--cWhite)'} style={{backgroundColor:'var(--cWhiteV2)'}}/>}
      </div>
      </section>


      <section>
      
      <Avatar
          src={getUrlImages(
            "/CLIENT-" + client?.id + ".webp?d=" + client?.updated_at
          )}
        //   name={getFullName(user)}
          style={{  width: '100%', height: 300,borderTopLeftRadius:'var(--bRadiusS)',borderTopRightRadius:'var(--bRadiusS)',borderBottomLeftRadius:0,borderBottomRightRadius:0,borderBottom:'1px solid var(--cWhiteV2)'  }}
        />
        <div>
                <div>
                        <div>
                            <Avatar 
                            src={getUrlImages(
                                "/CLIENT-" + client?.id + ".webp?d=" + client?.updated_at
                            )}
                                name={user?.name}
                                w={191}
                                h={191}
                                
                                />
                                <div>
                                <span> {getFullName(user)}</span>
                                <span> {getFullName(user)}</span>

                                </div>
                        </div>
                </div>

                <div>
                <div>{IconType} assaas</div> 
                <div><IconPhone size={16} color={'var(--cWhiteV1)'}/> assaas</div> 
                <div><IconEmail size={16} color={'var(--cWhiteV1)'}/> assaas</div>
                </div>
        </div> 
        
      </section>
      <section >
       
      <WidgetBase title={'Datos Personales'} variant={'V1'} titleStyle={{fontSize:16}}>
        
        <div>Carnet de identidad</div>
        <div>12122112212</div>


      </WidgetBase >
      <WidgetBase variant={'V1'}>
        as
      </WidgetBase>
      <WidgetBase variant={'V1'}>
        as
      </WidgetBase>
      </section>


    </div>
   
  </DataModal>
  )
}

export default ProfileModal