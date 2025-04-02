import React, { createContext, useContext, useState } from 'react';

type ModalContextType = {
  isOpen: boolean;
  modalType: string | null;
  modalData: any | null;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  modalType: null,
  modalData: null,
  openModal: () => {},
  closeModal: () => {},
});

export const useModal = () => useContext(ModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any | null>(null);

  const openModal = (type: string, data?: any) => {
    setModalType(type);
    setModalData(data || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // We delay clearing the type and data to allow for exit animations
    setTimeout(() => {
      setModalType(null);
      setModalData(null);
    }, 200);
  };

  return (
    <ModalContext.Provider value={{ isOpen, modalType, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};