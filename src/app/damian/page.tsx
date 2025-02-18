'use client'


import Button from '@/mk/components/forms/Button/Button'
import Input from '@/mk/components/forms/Input/Input'
import TextArea from '@/mk/components/forms/TextArea/TextArea'
import DataModal from '@/mk/components/ui/DataModal/DataModal'
import React, { useState } from 'react'

const page = () => {
    const [name,setName]= useState('');
    const [open,setOpen]=useState(false)
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