import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button"

type ModalProps = {
  openModal: boolean;
  closeModal: () => void;
  children: React.ReactNode;
};

function Modal({ openModal, closeModal, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (openModal) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [openModal]);

  return (
	
    <dialog className="rounded-lg"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
    >
		<div className="p-8">
		{children}
		<Button onClick={closeModal}>Cancel</Button>
		</div>
    </dialog>
  )
}

export default Modal
