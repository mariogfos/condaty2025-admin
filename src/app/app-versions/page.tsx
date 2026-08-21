"use client";
import React from 'react';
import AppVersionModal from '@/components/AppVersionModal/AppVersionModal';

export default function Page() {
  // This route simply shows the modal. Closing navigates back.
  return <AppVersionModal />;
}
