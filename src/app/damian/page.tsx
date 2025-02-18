'use client'


import Input from '@/mk/components/forms/Input/Input'
import TextArea from '@/mk/components/forms/TextArea/TextArea'
import React, { useState } from 'react'

const page = () => {
    const [name,setName]= useState('')
  return (
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
    </div>
  )
}

export default page