import React from 'react'
import WidgetBase from '../../WidgetBase/WidgetBase'
import styles from './WidgetContentsResume.module.css'
import { Avatar } from '@/mk/components/ui/Avatar/Avatar'
import { getFullName, getUrlImages } from '@/mk/utils/string'
import Image from 'next/image'
import { IconComment, IconLike } from '@/components/layout/icons/IconsBiblioteca'

const WidgetContentsResume = (data:any) => {
  return (
    <WidgetBase variant={'V1'} title={'Comunidad'} >
    

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
                  name={'getFullName(data?.user)'}
                  src={getUrlImages(
                    "/ADM-" +
                      data?.user?.id +
                      ".webp?d=" +
                      data?.user?.updated_at
                  )}
                />
                <section>
                  <div>{data?.user?.name} aa</div>
                  <div className={styles.textSecond}>{data?.user?.name} aa</div>
                </section>
         </div>
            <div className={styles.textSecond}>
                asass
            </div>    
            
        
      </div>  
         <section className={styles.descriptionArea}>
            <div className={styles.textSecond} style={{fontSize:14}}>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Labore voluptatem esse quisquam eos, neque voluptates necessitatibus voluptate, nulla officiis ab earum dolorum vero, quo facilis sed provident! Unde, voluptatibus corrupti?</div>
           <Image
              src={data?.user?.avatar}
              alt={data?.user?.name}
              width={502}
              height={387}
            />
            <div>
                <IconLike color={'var(--cWhiteV1'}/>{data?.likes}
                <IconComment color={'var(--cWhiteV1'}/>{data?.comments}
            </div>
        
        </section>

    </div>

   </WidgetBase>
  )
}

export default WidgetContentsResume