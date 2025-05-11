'use client';

import { useState } from 'react';
import { MintStatus } from '@/components/poap/poap-mint-modal';

export interface MintModalState {
  open: boolean;
  status: MintStatus;
  error?: string;
}

export function usePOAPMintModal() {
  const [modalState, setModalState] = useState<MintModalState>({
    open: false,
    status: 'minting',
    error: undefined,
  });

  const openMintingModal = () => {
    setModalState({
      open: true,
      status: 'minting',
      error: undefined,
    });
  };

  const closeMintModal = () => {
    setModalState(prev => ({
      ...prev,
      open: false,
    }));
  };

  const setMintSuccess = () => {
    setModalState(prev => ({
      ...prev,
      status: 'success',
    }));
  };

  const setMintError = (error: string) => {
    setModalState({
      open: true,
      status: 'error',
      error,
    });
  };

  const onOpenChange = (open: boolean) => {
    setModalState(prev => ({
      ...prev,
      open,
    }));
  };

  return {
    modalState,
    openMintingModal,
    closeMintModal,
    setMintSuccess,
    setMintError,
    onOpenChange,
  };
} 