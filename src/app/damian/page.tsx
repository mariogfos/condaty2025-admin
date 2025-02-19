'use client'


import Button from '@/mk/components/forms/Button/Button'
import Input from '@/mk/components/forms/Input/Input'
import TextArea from '@/mk/components/forms/TextArea/TextArea'
import { Avatar } from '@/mk/components/ui/Avatar/Avatar'
import DataModal from '@/mk/components/ui/DataModal/DataModal'
import ItemList from '@/mk/components/ui/ItemList/ItemList'
import List from '@/mk/components/ui/List/List'
import { getFullName, getUrlImages } from '@/mk/utils/string'
import React, { useState } from 'react'

const page = () => {
    const [name,setName]= useState('');
    const [open,setOpen]=useState(false);
    const renderItem = (row: any) => {
      return (
        <div>
          <ItemList
            title={getFullName(row)}
            subtitle={"CI: " + row.ci}
            variant="V1"
            left={
              <Avatar
                name={getFullName(row)}
                src={getUrlImages("/AFF-" + row.id + ".webp?d=" + row.updated_at)}
              />
            }
          />
        </div>
      );
    };
  return (
    <>
    <div>

        <Input 
        name={'sas'}
         type="text"
         label='asa'
        // placeholder="Enter your name"
         value={name}
         onChange={(e) => setName(e.target.value)}


        />

        <TextArea
        name={'sas'}
        label='asa'
        // placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        />

<List data={
  [
    { id: 1, name: 'John', ci: '123' },
    { id: 2, name: 'Jane', ci: '456' },
    { id: 3, name: 'John', ci: '789' },
    ]
} renderItem={renderItem} />
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
    </div>
    <DataModal
      open={open}
      onClose={() => setOpen(false)}
      title="Modal title"
    
      >aaa
      
      
      <Input 
        name={'sas'}
         type="text"
         label='asa'
        // placeholder="Enter your name"
         value={name}
         onChange={(e) => setName(e.target.value)}


        />

</DataModal>
    </>
  )
}

export default page