import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import React, { Dispatch, FC, SetStateAction } from "react";
interface VoteModalProps {
  isOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  onVote: () => void;
}
const VoteModal: FC<VoteModalProps> = ({ isOpen, setIsModalOpen, onVote }) => {
  const { onClose } = useDisclosure();
  const handleClose = () => {
    setIsModalOpen(false);
    onClose();
  };
  return (
    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody pt={6} pb={6}>
          <Flex
            gap={"16px"}
            flexDir="column"
            alignItems="center"
            justifyContent="center"
          >
            <Heading fontSize="20px">
              Vote requires 3 BSM. <br /> Would you like to vote?
            </Heading>
          </Flex>
        </ModalBody>
        <ModalFooter justifyContent={"center"}>
          <Button bgColor={"yellow.400"} mr={3} onClick={onVote}>
            Pay 3 BSM to vote
          </Button>
          <Button bgColor="gray.300" mr={3} onClick={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VoteModal;
