import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { Dispatch, FC, SetStateAction } from "react";
interface LoaderModalProps {
  isOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}
const LoaderModal: FC<LoaderModalProps> = ({ isOpen, setIsModalOpen }) => {
  const { onClose } = useDisclosure();
  const handleClose = () => {
    setIsModalOpen(false);
    onClose();
  };
  return (
    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalBody pb={6}>
          <Flex
            gap={"16px"}
            flexDir="column"
            alignItems="center"
            justifyContent="center"
          >
            <Heading fontSize="20px">We are processing your request</Heading>
            <Text>Please wait...</Text>
            <Spinner
              thickness="6px"
              speed="0.65s"
              emptyColor="gray.200"
              color="yellow.400"
              size="xl"
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button bgColor={"indigoNight"} mr={3} onClick={handleClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LoaderModal;
