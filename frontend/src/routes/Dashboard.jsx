import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  HStack,
  Tooltip,
  ScaleFade,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useError } from "../hooks/useError";
import { AiFillDelete } from "react-icons/ai";
import { IconButton } from "@chakra-ui/react";
import { GrCaretPrevious, GrCaretNext } from "react-icons/gr";
import { useAuthContext } from "../hooks/useAuthContext";

const Dashboard = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dataId, setDataId] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [rows, setRows] = useState(
    JSON.parse(localStorage.getItem("rows")) || 10
  );
  const cancelRef = useRef();
  const { verify } = useError();
  const { register, handleSubmit, reset } = useForm();

  const createExpense = async (data) => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await axios.post("/api/expense", data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.status == 201) {
        fetchExpenses();
        reset();
        showToast(toast, "Expense Added!", "success");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      verify(error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get(
        `/api/expense/?page=${currentPage}&rows=${rows}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setData(data.expenses);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      verify(error);
    }
  };

  const handleDelete = async () => {
    setAlertOpen(false);
    try {
      await axios.delete(`/api/expense/${dataId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      fetchExpenses();
      showToast(toast, "Expense Deleted!", "info");
    } catch (error) {
      console.log(error);
      showToast(toast, "Something went Wrong!", "error");
    }
  };

  const handleClick = (id) => {
    setDataId(id);
    setAlertOpen(true);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRowChange = (e) => {
    setRows(e.target.value);
    localStorage.setItem("rows", JSON.stringify(e.target.value));
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [currentPage, rows]);

  return (
    <>
      <ScaleFade initialScale={0.9} in={true}>
        <Box
          rounded={"lg"}
          bg={"white"}
          boxShadow={"md"}
          p={6}
          my={5}
          mx={"auto"}
          w={["95%", "70%", "60%", "40%"]}
          maxWidth={"767px"}
        >
          <Heading fontSize="2xl" mb={3} textAlign={"center"}>
            Add your Expense
          </Heading>
          <form onSubmit={handleSubmit(createExpense)}>
            <VStack spacing={3}>
              <Input
                autoComplete="off"
                isRequired
                {...register("amount")}
                placeholder="Amount &#x20B9;"
              />
              <Select
                placeholder="Select Category"
                isRequired
                {...register("category")}
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
              <Input
                autoComplete="off"
                isRequired
                placeholder={"Description"}
                {...register("description")}
              />
              <Button
                colorScheme="teal"
                minWidth={"150px"}
                width={"40%"}
                type="submit"
                isLoading={loading}
              >
                Add Expense
              </Button>
            </VStack>
          </form>
        </Box>
      </ScaleFade>
      {data.length > 0 && (
        <TableContainer
          boxShadow={"md"}
          w={{ base: "90%", md: "75%", lg: "60%" }}
          mx={"auto"}
          my={10}
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
              {data.map((item, index) => (
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
                      bg={"red.200"}
                      _hover={{ bg: "red.300" }}
                      onClick={() => handleClick(item._id)}
                    />
                  </Td>
                </motion.tr>
              ))}
            </Tbody>
          </Table>
          <HStack justifyContent={"center"} my={3} spacing={4}>
            <Tooltip label="Previous">
              <IconButton
                icon={<GrCaretPrevious />}
                onClick={handlePreviousPage}
                isDisabled={currentPage === 1}
              />
            </Tooltip>
            <Tooltip label="Next">
              <IconButton
                icon={<GrCaretNext />}
                onClick={handleNextPage}
                isDisabled={currentPage === totalPages}
              />
            </Tooltip>
            <Box>
              Page {currentPage} of {totalPages}
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
      <AlertDialog
        isOpen={alertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setAlertOpen(false)}
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
              <Button ref={cancelRef} onClick={() => setAlertOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default Dashboard;
