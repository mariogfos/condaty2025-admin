import DataModal from '@/mk/components/ui/DataModal/DataModal'
import { useAuth } from '@/mk/contexts/AuthProvider';
import React, { useEffect, useState } from 'react'
import { IconAdmin, IconArrowRight, IconEdit, IconEmail, IconGuardShield, IconLockEmail, IconLook, IconPhone, IconTrash, IconUser } from '../layout/icons/IconsBiblioteca';
import styles from './ProfileModal.module.css'
import WidgetBase from '../Widgets/WidgetBase/WidgetBase';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import Authentication from '@/modulos/Profile/Authentication';
import useAxios from '@/mk/hooks/useAxios';
import Input from '@/mk/components/forms/Input/Input';
import EditProfile from './EditProfile/EditProfile';

interface ProfileModalProps {
    open:boolean;
    onClose:any;
    reLoad?:any;
    dataID?:string | number;
    titleBack?:string;
    title?:string;
    edit?:boolean;
    del?:boolean;
    type?:string;

}
interface FormState {
    id?: string | number;
    ci?: string;
    name?: string;
    middle_name?: string;
    last_name?: string;
    mother_last_name?: string;
    phone?: string;
    avatar?: string;
    address?: string;
    email?: string;
    password?: string;
    pinned?: number;
    code?: string;
  }
const ProfileModal = ({
    open,
    onClose,
    dataID,
    titleBack ="Volver", 
    title='Mi Perfil',
    reLoad,
    edit = true,
    del = true,
    type

}:ProfileModalProps) => {
    const { user , getUser , showToast } = useAuth();
    const { execute } = useAxios();  
    const [formState, setFormState] = useState<FormState>({});
    const [errors, setErrors] = useState<any>({});
    const [openAuthModal, setOpenAuthModal] = useState(false);
    const [authType, setAuthType] = useState("");
    const [openEdit, setOpenEdit] = useState(false);
    const [openDel, setOpenDel] = useState(false);
    const client = user?.clients?.filter(
        (item: any) => item?.id === user?.client_id
      )[0];
    const IconType = type === 'admin' ? <IconAdmin color={'var(--cAccent)'} size={16}/> 
    : (type === 'owner' || type === 'homeOwner' )? <IconUser color={'var(--cAccent)'} size={18}/> 
    : <IconGuardShield color={'var(--cAccent)'} size={20}/>
    const url = type === 'admin'? `/users` : type === 'owner'?  `/owners` : type === 'homeOwner' ? `/homeowners`:`/guards`;
    
    const profileRole = type === 'admin'? 'Administrador' :type === 'owner'? 'Residente' :type === 'homeOwner'? 'Propietario' : 'Guardia';
    const { data,reLoad:reLoadDet } = useAxios(
      url,
      "GET",
      {
        searchBy: dataID,  
        fullType: "DET",
      },
      true
    );
    const imageUrl = () => {
      const userId = data?.data[0]?.id;
      const timestamp = data?.data[0]?.updated_at;
      
      switch(type) {
        case 'admin':
          return `/ADM-${userId}.webp?d=${timestamp}`;
        case 'owner':
          return `/OWNER-${userId}.webp?d=${timestamp}`;
        case 'homeOwner':
          return `/HOMEOWNER-${userId}.webp?d=${timestamp}`;  
        default:
          return `/GUARD-${userId}.webp?d=${timestamp}`;
      }
    };
    
    const urlImages = imageUrl();
      // console.log(data,'dadada',dataID,'did')

      useEffect(() => {
        if (data?.data[0]) {
          setFormState({
            id: data?.data[0]?.id,
            ci: data?.data[0]?.ci,
            name: data?.data[0]?.name,
            middle_name: data?.data[0]?.middle_name,
            last_name: data?.data[0]?.last_name,
            mother_last_name: data?.data[0]?.mother_last_name,
            phone: data?.data[0]?.phone,
            avatar: data?.data[0]?.avatar,
            address: data?.data[0]?.address,
            email: data?.data[0]?.email,
          })
        }
      },[openEdit,data]);





      const onChange = (e: any) => {
        setFormState({
          ...formState,
          [e.target.name]: e.target.value,
        });
      };
     

    




    const onChangeEmail = () => {
        setAuthType("M");
        setOpenAuthModal(true);
      };
    
      const onChangePassword = () => {
        setAuthType("P");
        setOpenAuthModal(true);
      };
    const onDel = async() =>{


      const { data } = await execute(url + "/" + formState.id, "DELETE", {
        is_canceled: "Y",
      });
      if (data?.success == true) {
        // getAreasM();
        showToast(profileRole+" desvinculado con éxito", "success");
        onClose();
        // setOpenConfirm({ open: false, id: null });
      }
    }





  return (
    <DataModal
    title={titleBack}
    open={open}
    onClose={onClose}
    fullScreen
    variant="V2"
     buttonText=""
     buttonCancel=""
    // onSave={() => logout()}
  >
    <div className={styles.ProfileModal}>
      <section>  
      <h1>{title}</h1>
      <div>
    {edit &&  <IconEdit className='' square size={32} color={'var(--cWhite)'} style={{backgroundColor:'var(--cWhiteV2)',cursor:'pointer'}} onClick={()=>setOpenEdit(true)}/>}
    {del &&  <IconTrash className='' square size={32} color={'var(--cWhite)'} style={{backgroundColor:'var(--cWhiteV2)',cursor:'pointer'}} onClick={()=>setOpenDel(true)}/>}
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
                            src={getUrlImages(urlImages)}
                                name={getFullName(data?.data[0])}
                                w={191}
                                h={191}
                                
                                />
                                <div>
                                <span> {getFullName(data?.data[0])}</span>
                                 <span>{profileRole}</span> 

                                </div>
                        </div>
                </div>

                <div>
                <div>{IconType} {profileRole}</div> 
                <div><IconPhone size={16} color={'var(--cWhiteV1)'}/>{data?.data[0]?.phone || 'Sin registrar'}</div> 
                <div><IconEmail size={16} color={'var(--cWhiteV1)'}/>{data?.data[0]?.email || 'Sin registrar'}</div>
                </div>
        </div> 
        
      </section>
      <section>
       
      <WidgetBase title={'Datos Personales'} variant={'V1'} titleStyle={{fontSize:16}}>
      <div className='bottomLine' />
        <div>
            <div>Carnet de identidad</div>
            <div>{data?.data[0]?.ci}</div>
        </div>
       { type !== 'homeOwner' && <>
        <div className='bottomLine' />
        <div>
            <div>Condominio</div>
            {data?.data[0]?.clients.map((item:any)=> (
              <div key={item.id}>- {item.name}</div>
            ))} 
        </div>   
        </>   }
 
        <div className='bottomLine' />

        <div>
            <div>Domicilio</div>
            <div>{type==='owner'? ( !data?.data[0]?.dpto[0]?.description || !data?.data[0]?.dpto[0]?.nro ? 'Sin registrar': `${data?.data[0]?.dpto[0]?.description} ${data?.data[0]?.dpto[0]?.nro}`) 
            : data?.data[0]?.address || 'Sin registro'}
            </div>
        </div> 
         
      <div className='bottomLine'/>



      </WidgetBase >
      <WidgetBase title={'Documentos Personales' } variant={'V1'} titleStyle={{fontSize:16}}>
        <div className='bottomLine'></div>
        <div style={{marginTop:16}}>Sin datos para mostrar</div>
      </WidgetBase>



{  user.id === data?.data[0]?.id &&     
  
  <WidgetBase title={'Datos de acceso'} variant={'V1'} titleStyle={{fontSize:16}} >
      <div className='bottomLine'/>
        
        <div className={styles.buttonChange} onClick={onChangeEmail}>
        <IconLockEmail reverse/> <div>Cambiar correo electrónico</div> <IconArrowRight />
        </div>
      <div className='bottomLine'/>
      <div className={styles.buttonChange}  onClick={onChangePassword}>
        <IconLook reverse/> <div>Cambiar contraseña</div> <IconArrowRight />
        </div>
      <div className='bottomLine'/>

      </WidgetBase>}
      </section>


    </div>
    {openAuthModal && (
        <Authentication
          open={openAuthModal}
          onClose={() => setOpenAuthModal(false)}
          type={authType}
          formState={formState}
          setFormState={setFormState}
          errors={errors}
          setErrors={setErrors}
          execute={execute}
          getUser={getUser}
          user={user}
          showToast={showToast}
        />
      )}

    {openEdit && <EditProfile
      open={openEdit}
      onClose={() => setOpenEdit(false)}
      formState={formState}
      onChange={onChange}
      errors={errors}
      urlImages={urlImages}
      setErrors={setErrors}
      setFormState={setFormState}
      url={url}
      reLoad={reLoadDet}
      reLoadList={reLoad}
    />
   }
   {openDel && <DataModal
    title={`Desvincular ${profileRole}`}
    open={openDel}
    onClose={() => setOpenDel(false)}
     buttonText="Desvincular"
     buttonCancel="Cancelar"
    onSave={onDel}
  >
    <div>
    <p style={{fontSize:'var(--sL)'}}>¿Estás seguro de que quieres eliminar este registro?</p>
    <p>Esta acción no se puede deshacer.</p>
    </div>
  </DataModal>}
  
   
  </DataModal>
  )
}

export default ProfileModal