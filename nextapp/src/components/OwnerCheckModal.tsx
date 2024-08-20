import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import React, { FC } from "react";
import { useRouter } from "next/navigation";

interface OwnerCheckModalProps {
  isOpen: boolean;
}

const OwnerCheckModal: FC<OwnerCheckModalProps> = ({ isOpen }) => {
  const { onClose } = useDisclosure();
  const router = useRouter();
  return (
    // 추후에 api 넣기
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you a business owner?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Only business owner is available for this feature. If you are not a
            business owner, please go back.
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => router.push("/mint")}
            >
              I am a business owner
            </Button>
            <Button variant="ghost">Go Back</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
export default OwnerCheckModal;
