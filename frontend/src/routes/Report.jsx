import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Heading,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useBreakpointValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  Tooltip,
  Badge,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  CircularProgress,
} from "@chakra-ui/react";
import axios from "axios";
import moment from "moment";
import { useAuthContext } from "../hooks/useAuthContext";
import { useError } from "../hooks/useError";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaDownload, FaHistory } from "react-icons/fa";
import { Loading } from "../components/Loading";
import Chart from "../components/Chart";

const Report = () => {
  const [type, setType] = useState("monthly");
  const { user } = useAuthContext();
  const { verify } = useError();
  const toastRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [downloads, setDownloads] = useState([]);
  const modalSize = useBreakpointValue({
    base: "sm",
    md: "md",
    lg: "lg",
  });

  const { isPending, isError, data, error } = useQuery({
    queryKey: ["user-report", type],
    queryFn: async () => {
      const { data } = await axios.get(`/api/premium/report?type=${type}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return data;
    },
  });

  if (isError) verify(error);

  const downloadReport = useMutation({
    mutationFn: () => {
      toastRef.current = toast.loading("Generating file...");
      return axios.post(
        "/api/premium/report/download",
        {
          data,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: "blob",
        }
      );
    },
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Expensify.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.update(toastRef.current, {
        type: "success",
        isLoading: false,
        render: "File processed successfully!",
        autoClose: 3000,
      });
    },
    onError: (error) => {
      toast.dismiss();
      verify(error);
    },
  });

  const downloadFile = (url) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
    xhr.onload = function () {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const newBlob = new Blob([blob]);
        const anchor = document.createElement("a");
        anchor.href = URL.createObjectURL(newBlob);
        anchor.download = "Expensify.csv";
        anchor.click();
      } else {
        toast.error("Failed to download file!");
      }
    };
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchDownloads = async () => {
      try {
        const { data } = await axios.get(
          "/api/premium/report/download-history",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (data.length == 0) {
          toast.info("No Previous records found!");
        } else {
          setDownloads(data);
        }
      } catch (error) {
        verify(error);
      }
    };
    fetchDownloads();
  }, [isOpen]);

  if (isPending) {
    return <Loading />;
  }

  const totalAmount = data?.reduce((total, item) => total + item.amount, 0);

  return (
    <>
      <Box
        rounded={"lg"}
        bg={"white"}
        boxShadow={"md"}
        p={3}
        my={5}
        mx={"auto"}
        w={{ base: "90%", md: "60%", lg: "40%" }}
        maxWidth={"600px"}
      >
        <Heading textAlign={"center"} as={"h3"} mb={3}>
          Financial Snapshot
        </Heading>
        <Divider />
        <HStack justifyContent={"space-evenly"} my={4}>
          <Select
            width={"40%"}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
          <Tooltip label="Download Report">
            <IconButton
              icon={<FaDownload />}
              onClick={() => downloadReport.mutate()}
              colorScheme="messenger"
              isDisabled={data?.length === 0}
            />
          </Tooltip>
          <Tooltip label="Download History">
            <IconButton
              icon={<FaHistory />}
              onClick={onOpen}
              colorScheme="purple"
            />
          </Tooltip>
        </HStack>
        <Divider />
        <Center>
          <Badge
            colorScheme="red"
            fontSize="0.9em"
            my={2}
            p={1.5}
            textTransform={"none"}
            rounded={"md"}
          >
            {type === "monthly"
              ? `Total Expenses in ${moment(new Date()).format("MMMM")} : `
              : `Total Expenses in the year ${moment(new Date()).format(
                  "YYYY"
                )} : `}
            &#x20B9;{totalAmount}
          </Badge>
        </Center>
      </Box>
      <Box
        mx={"auto"}
        w={["100%", "95%", "90%", "85%", "75%"]}
        maxWidth={"1024px"}
        my={3}
      >
        {data?.length > 0 && <Chart data={data} type={type} />}
      </Box>
      {data?.length === 0 && (
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxW={"600px"}
          mx={"auto"}
          w={["95%", "85%", "70%", "60%"]}
          rounded={"lg"}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No Data Found!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Please add an expense from the Dashboard to see it here.
          </AlertDescription>
        </Alert>
      )}
      <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign={"center"}>Download History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th textAlign={"center"}>#</Th>
                    <Th textAlign={"center"}>Date</Th>
                    <Th textAlign={"center"}>Download </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {downloads?.map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Td textAlign={"center"}>{index + 1}</Td>
                      <Td textAlign="center">
                        {moment(item.createdAt).format(
                          "MMMM DD, YYYY hh:mm:ss A"
                        )}
                      </Td>
                      <Td textAlign="center">
                        <IconButton
                          icon={<FaDownload />}
                          colorScheme="whatsapp"
                          onClick={() => downloadFile(item.url)}
                        />
                      </Td>
                    </motion.tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mx={"auto"} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Report;
