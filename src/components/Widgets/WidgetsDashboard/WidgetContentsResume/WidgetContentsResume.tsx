import React from 'react'
import WidgetBase from '../../WidgetBase/WidgetBase'
import styles from './WidgetContentsResume.module.css'
import { Avatar } from '@/mk/components/ui/Avatar/Avatar'
import { getFullName, getUrlImages } from '@/mk/utils/string'
import { getDateTimeAgo } from '@/mk/utils/date'
import Image from 'next/image'
import { IconComment, IconLike } from '@/components/layout/icons/IconsBiblioteca'

const WidgetContentsResume = ({data}:any) => {
  console.log(data,'data desde widget contents resume')
  return (
    <WidgetBase variant={'V1'} title={'Comunidad'} >
    <div style={{maxHeight: 800, overflowY: 'auto'}}>
    {data?.length > 0 ? data.map((item: any, index: number) => (
      <div key={item.id}>
      <div className='bottomLine'/>
      <div className={styles.contentContainer}>
      <div className={styles.avatarContainer}>
        {/* <Avatar
                  name={getFullName(user)}
                  src={getUrlImages(
                    "/ADM-" +
                      user?.id +
                      ".webp?d=" +
                      user?.updated_at
                  )} */}
          <div>
             <Avatar
                  name={getFullName(item?.user)}
                  src={getUrlImages(
                    "/ADM-" +
                      item?.user?.id +
                      ".webp?d=" +
                      item?.user?.updated_at
                  )}
                />
                <section>
                  <div>{getFullName(item?.user)}</div>
                  <div className={styles.textSecond}>Administrador</div>
                </section>
         </div>
            <div className={styles.textSecond}>
                {getDateTimeAgo(item?.created_at)}
            </div>    
            
        
      </div>  
         <section className={styles.descriptionArea}>
          <div>{item?.title}</div>
            <div className={styles.textSecond} style={{fontSize:14,textAlign:'left',justifyContent:'flex-start',alignItems:'flex-start'}}>{item?.description}</div>
           {item?.images && item?.images[0] && (
            <div>
             <img
             src={getUrlImages(
              "/CONT-" +
                item?.id +
                "-" +
                item?.images[0]?.id +
                ".webp" +
                "?" +
                item?.updated_at
            )}
               alt={item?.title}
              //  width={502}
               height={387}
               style={{borderRadius:'var(--bRadiusS)'}}
             />
             </div>
           )} 
            <div style={{display:'flex', alignItems:'center', paddingBottom: 'var(--spS)'}}>
              
                  <IconLike color={'var(--cWhiteV1'}/>
                  <div>{item?.likes}</div>
             
                  <IconComment color={'var(--cWhiteV1'}/>
                  <div>{item?.comments_count}</div>
               
            </div>
        
        </section>
    </div>
    </div>
    )) :<div style={{display:'flex',justifyContent:'center',alignItems:'center',height: 800}}>Aún no hay publicaciones</div>
  }
    </div>
   </WidgetBase>
  )
}

export default WidgetContentsResume