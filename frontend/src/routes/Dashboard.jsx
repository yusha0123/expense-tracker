import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  HStack,
  Heading,
  IconButton,
  Input,
  ScaleFade,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Grid,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import moment from "moment";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AiFillDelete } from "react-icons/ai";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import { useAuthContext } from "../hooks/useAuthContext";
import { useError } from "../hooks/useError";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { onClose, onOpen, isOpen } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const currentPage = parseInt(queryParams.get("page")) || 1;
  const [dataId, setDataId] = useState(null);
  const [rows, setRows] = useState(
    JSON.parse(localStorage.getItem("rows")) || 10
  );
  const cancelRef = useRef();
  const { verify } = useError();
  const { register, handleSubmit, reset } = useForm();

  const { isPending, isError, data, error } = useQuery({
    queryKey: ["user-expenses", { currentPage, rows }],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/expense/?page=${currentPage}&rows=${rows}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      navigate(`/dashboard?page=${data.currentPage}`);
      return data;
    },
  });

  if (isError) {
    verify(error);
  }

  const createExpense = useMutation({
    mutationFn: (expense) => {
      return axios.post("/api/expense", expense, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-expenses", { currentPage, rows }],
      });
      reset();
    },
    onError: (error) => {
      verify(error);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: () => {
      onClose();
      return axios.delete(`/api/expense/${dataId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-expenses", { currentPage, rows }],
      });
      toast.info("Expense Deleted!", {
        autoClose: 2000,
      });
    },
    onError: (error) => {
      verify(error);
    },
  });

  const handleClick = (id) => {
    setDataId(id);
    onOpen();
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      navigate(`/dashboard?page=${currentPage - 1}`);
    }
  };

  const handleNextPage = () => {
    if (currentPage < data?.totalPages) {
      navigate(`/dashboard?page=${currentPage + 1}`);
    }
  };

  const handleRowChange = (e) => {
    const newRowValue = e.target.value;
    setRows(newRowValue);
    localStorage.setItem("rows", JSON.stringify(newRowValue));
    const totalItems = data?.totalItems;
    const newTotalPages = Math.ceil(totalItems / newRowValue);
    let newPage = Math.min(currentPage, newTotalPages);
    if (currentPage > newTotalPages) {
      newPage = newTotalPages;
    }
    navigate(`/dashboard?page=${newPage}`);
  };

  return (
    <>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Expense
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={deleteExpense.mutate} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <ScaleFade initialScale={0.9} in={true}>
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"base"}
          p={6}
          my={5}
          mx={"auto"}
          w={["95%", "85%", "60%", "40%"]}
          maxWidth={{
            sm: "400px",
            md: "767px",
          }}
        >
          <Heading fontSize="2xl" mb={3} textAlign={"center"}>
            Add your Expense
          </Heading>
          <form onSubmit={handleSubmit(createExpense.mutate)}>
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={3}
              marginBottom={3}
            >
              <Input
                autoComplete="off"
                isRequired
                type="number"
                {...register("amount")}
                size={{
                  base: "sm",
                  md: "md",
                }}
                placeholder="Amount &#x20B9;"
              />
              <Select
                placeholder="Select Category"
                isRequired
                {...register("category")}
                size={{
                  base: "sm",
                  md: "md",
                }}
              >
                <option value="Mobile & Computers">Mobile & Computers</option>
                <option value="Books & Education">Books & Education</option>
                <option value="Sports, Outdoor & Travel">
                  Sports, Outdoor & Travel
                </option>
                <option value="Bills & EMI's">Bills & EMI's</option>
                <option value="Groceries & Pet Supplies">
                  Groceries & Pet Supplies
                </option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Gifts & Donations">Gifts & Donations</option>
                <option value="Investments">Investments</option>
                <option value="Insurance">Insurance</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Home & Utilities">Home & Utilities</option>
                <option value="Hobbies & Leisure">Hobbies & Leisure</option>
              </Select>
            </Grid>
            <VStack spacing={3}>
              <Input
                autoComplete="off"
                isRequired
                placeholder={"Description"}
                {...register("description")}
                size={{
                  base: "sm",
                  md: "md",
                }}
              />
              <Button
                colorScheme="teal"
                minWidth={"150px"}
                width={"40%"}
                size={{
                  base: "sm",
                  md: "md",
                }}
                type="submit"
                isLoading={createExpense.isPending}
              >
                Add Expense
              </Button>
            </VStack>
          </form>
        </Box>
      </ScaleFade>
      {isPending && (
        <Center mt={20}>
          <Spinner size="lg" />
        </Center>
      )}
      {data?.expenses?.length > 0 && (
        <TableContainer
          boxShadow={"md"}
          w={{ base: "90%", md: "80%", lg: "60%" }}
          mx={"auto"}
          maxW={"1180px"}
          my={5}
        >
          <Table variant="striped" size={"sm"} colorScheme="blackAlpha">
            <Thead>
              <Tr>
                <Th textAlign={"center"}>#</Th>
                <Th textAlign={"center"}>Date</Th>
                <Th textAlign={"center"}>Amount</Th>
                <Th textAlign={"center"}>Category</Th>
                <Th textAlign={"center"}>Description</Th>
                <Th textAlign={"center"}>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.expenses?.map((item, index) => (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Td textAlign={"center"}>{index + 1}</Td>
                  <Td textAlign={"center"}>
                    {moment(item.createdAt).format("DD MMMM YYYY")}
                  </Td>
                  <Td textAlign={"center"}>{item.amount}</Td>
                  <Td textAlign={"center"}>{item.category}</Td>
                  <Td textAlign={"center"}>{item.description}</Td>
                  <Td textAlign={"center"}>
                    <IconButton
                      icon={<AiFillDelete />}
                      colorScheme="red"
                      onClick={() => handleClick(item._id)}
                      isDisabled={deleteExpense.isPending}
                    />
                  </Td>
                </motion.tr>
              ))}
            </Tbody>
          </Table>
          <HStack justifyContent={"center"} my={3} spacing={4}>
            <IconButton
              icon={<GrCaretPrevious />}
              onClick={handlePreviousPage}
              isDisabled={currentPage === 1}
              size={{
                base: "sm",
                xl: "md",
              }}
            />
            <IconButton
              icon={<GrCaretNext />}
              size={{
                base: "sm",
                xl: "md",
              }}
              onClick={handleNextPage}
              isDisabled={currentPage === data?.totalPages}
            />
            <Box>
              Page {currentPage} of {data?.totalPages}
            </Box>
            <Select
              size="sm"
              width={"fit-content"}
              value={rows}
              onChange={handleRowChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </HStack>
        </TableContainer>
      )}
      {data?.expenses?.length > 0 && (
        <div
          style={{
            height: "0.5rem",
          }}
        />
      )}
    </>
  );
};

export default Dashboard;
