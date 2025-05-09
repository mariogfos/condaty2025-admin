import React from 'react'
import WidgetBase from '../../WidgetBase/WidgetBase'
import styles from './WidgetContentsResume.module.css'
import { Avatar } from '@/mk/components/ui/Avatar/Avatar'
import { getFullName, getUrlImages } from '@/mk/utils/string'
import { getDateTimeAgo } from '@/mk/utils/date'
import Image from 'next/image'
import { IconComment, IconLike } from '@/components/layout/icons/IconsBiblioteca'

// const data = [
//   {
//     "client_id": "98d1f463-c2bb-4174-99f3-dd82171c7aaa",
//     "comments_count": 1,
//     "created_at": "2025-04-30T19:40:42.000000Z",
//     "deleted_at": null,
//     "description": "Descripción de mi noticia 1",
//     "destiny": "T",
//     "id": 1,
//     "images": [
//       {
//         "url": "imagen1.jpg",
//         "caption": "Portada noticia 1"
//       }
//     ],
//     "liked": 0,
//     "likes": 1,
//     "nimages": 1,
//     "status": "A",
//     "title": "Mi noticia 1",
//     "type": "I",
//     "updated_at": "2025-04-30T20:30:41.000000Z",
//     "url": "webp",
//     "user": {
//       "id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3",
//       "name": "Douglas",
//       "middle_name": "",
//       "mother_last_name": "",
//       "last_name": "Diez",
//       "email": "douglas.diez@example.com"
//     },
//     "user_id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3"
//   },
//   {
//     "client_id": "98d1f463-c2bb-4174-99f3-dd82171c7aaa",
//     "comments_count": 2,
//     "created_at": "2025-05-01T10:15:00.000000Z",
//     "deleted_at": null,
//     "description": "Descripción de mi noticia 2",
//     "destiny": "T",
//     "id": 2,
//     "images": [
//       {
//         "url": "imagen2.jpg",
//         "caption": "Portada noticia 2"
//       }
//     ],
//     "liked": 1,
//     "likes": 5,
//     "nimages": 1,
//     "status": "A",
//     "title": "Mi noticia 2",
//     "type": "I",
//     "updated_at": "2025-05-01T11:00:00.000000Z",
//     "url": "webp",
//     "user": {
//       "id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3",
//       "name": "Douglas",
//       "middle_name": "",
//       "mother_last_name": "",
//       "last_name": "Diez",
//       "email": "douglas.diez@example.com"
//     },
//     "user_id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3"
//   },
//   {
//     "client_id": "98d1f463-c2bb-4174-99f3-dd82171c7aaa",
//     "comments_count": 0,
//     "created_at": "2025-05-02T08:30:25.000000Z",
//     "deleted_at": null,
//     "description": "Descripción de mi noticia 3",
//     "destiny": "T",
//     "id": 3,
//     "images": [
//       {
//         "url": "imagen3.jpg",
//         "caption": "Portada noticia 3"
//       }
//     ],
//     "liked": 0,
//     "likes": 2,
//     "nimages": 1,
//     "status": "A",
//     "title": "Mi noticia 3",
//     "type": "I",
//     "updated_at": "2025-05-02T09:15:10.000000Z",
//     "url": "webp",
//     "user": {
//       "id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3",
//       "name": "Douglas",
//       "middle_name": "",
//       "mother_last_name": "",
//       "last_name": "Diez",
//       "email": "douglas.diez@example.com"
//     },
//     "user_id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3"
//   },
//   {
//     "client_id": "98d1f463-c2bb-4174-99f3-dd82171c7aaa",
//     "comments_count": 3,
//     "created_at": "2025-05-03T14:05:55.000000Z",
//     "deleted_at": null,
//     "description": "Descripción de mi noticia 4",
//     "destiny": "T",
//     "id": 4,
//     "images": [
//       {
//         "url": "imagen4.jpg",
//         "caption": "Portada noticia 4"
//       }
//     ],
//     "liked": 1,
//     "likes": 8,
//     "nimages": 1,
//     "status": "A",
//     "title": "Mi noticia 4",
//     "type": "I",
//     "updated_at": "2025-05-03T15:00:00.000000Z",
//     "url": "webp",
//     "user": {
//       "id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3",
//       "name": "Douglas",
//       "middle_name": "",
//       "mother_last_name": "",
//       "last_name": "Diez",
//       "email": "douglas.diez@example.com"
//     },
//     "user_id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3"
//   },
//   {
//     "client_id": "98d1f463-c2bb-4174-99f3-dd82171c7aaa",
//     "comments_count": 1,
//     "created_at": "2025-05-04T16:20:10.000000Z",
//     "deleted_at": null,
//     "description": "Descripción de mi noticia 5",
//     "destiny": "T",
//     "id": 5,
//     "images": [
//       {
//         "url": "imagen5.jpg",
//         "caption": "Portada noticia 5"
//       }
//     ],
//     "liked": 0,
//     "likes": 3,
//     "nimages": 1,
//     "status": "A",
//     "title": "Mi noticia 5",
//     "type": "I",
//     "updated_at": "2025-05-04T17:00:00.000000Z",
//     "url": "webp",
//     "user": {
//       "id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3",
//       "name": "Douglas",
//       "middle_name": "",
//       "mother_last_name": "",
//       "last_name": "Diez",
//       "email": "douglas.diez@example.com"
//     },
//     "user_id": "98d1f463-c2bb-4174-99f3-dd82171c7ff3"
//   }
// ]







const WidgetContentsResume = ({data}:any) => {
  return (
    <WidgetBase variant={'V1'} title={'Comunidad'} >
    <div style={{maxHeight: '90%', overflowY: 'auto'}}>
    {data && data.map((item: any, index: number) => (
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
            <div>
              
                  <IconLike color={'var(--cWhiteV1'}/>
                  <div>{item?.likes}</div>
             
                  <IconComment color={'var(--cWhiteV1'}/>
                  <div>{item?.comments_count}</div>
               
            </div>
        
        </section>
    </div>
    </div>
    ))}
    </div>
   </WidgetBase>
  )
}

export default WidgetContentsResume