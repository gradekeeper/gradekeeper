import { DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Heading,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { _null } from "../../../lib/logic";
import { useUserContext } from "../../../UserContext";
import { TopBar } from "../../TopBar";
import { CreateBlock } from "../block/CreateBlock";
import { CreateCourse } from "../course/CreateCourse";
import CoursePill from "./CoursePill";

const CourseList = () => {
  const { user } = useUserContext();
  const isLoading = !user;
  const cancelRef = useRef<any>();
  const [deleteStudyBlock, setDeleteStudyBlock] = useState(_null<any>());
  const toast = useToast();
  const router = useRouter();
  const [isDeletingStudyBlock, setIsDeletingSb] = useState(false);
  const context = useUserContext();
  const [courseCreateBlockId, setCourseCreateBlockId] = useState("");
  const createBlockDisclosure = useDisclosure();
  return (
    <>
      <div className="mb-12">
        <TopBar />
        <>
          <Head>
            <title>My courses</title>
          </Head>
          <AlertDialog
            isOpen={deleteStudyBlock !== null}
            leastDestructiveRef={cancelRef}
            onClose={() => {
              setDeleteStudyBlock(null);
            }}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete block &lsquo;{deleteStudyBlock?.name}&rsquo;
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you <strong>sure</strong> you want to delete {deleteStudyBlock?.name}? <br />
                  This will delete <strong>{deleteStudyBlock?.subjects.length}</strong> courses.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button
                    ref={cancelRef}
                    onClick={() => {
                      setDeleteStudyBlock(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={async () => {
                      setIsDeletingSb(true);
                      await fetch(`/api/block/${deleteStudyBlock?.id ?? ""}`, { method: "DELETE" });
                      await context.redownload();
                      toast({
                        title: "Study block deleted.",
                        description: deleteStudyBlock?.name + " deleted.",
                        duration: 4000,
                        isClosable: true,
                        status: "success",
                      });
                      setIsDeletingSb(false);
                      setDeleteStudyBlock(null);
                    }}
                    isLoading={isDeletingStudyBlock}
                    ml={3}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
          <CreateCourseModal blockId={courseCreateBlockId} isOpen={!!courseCreateBlockId} onClose={() => setCourseCreateBlockId("")} />
          <CreateBlockModal isOpen={createBlockDisclosure.isOpen} onClose={createBlockDisclosure.onClose} />
          <div>
            <div className={"flex flex-col px-12"}>
              <Skeleton isLoaded={(user && !isLoading) ?? false}>
                {(!user?.studyBlocks || user?.studyBlocks?.length === 0) && (
                  <div>
                    <div>
                      <Box mb={6}>
                        <Heading as="h2" size="md">
                          Welcome to Gradekeeper.
                        </Heading>
                        <Heading size="sm">Let&apos;s get you set up.</Heading>
                      </Box>
                      <Box mb={6}>
                        Gradekeeper is organised around a system of &lsquo;study blocks&rsquo;, which can be trimesters, semesters, or
                        terms, depending on your university.
                      </Box>
                      <Box mb={6}>
                        <Alert>
                          <AlertIcon />
                          <AlertDescription>Let&apos;s start by making a study block.</AlertDescription>
                        </Alert>
                      </Box>
                      <Button colorScheme="orange" size="sm" onClick={createBlockDisclosure.onOpen}>
                        + New study block
                      </Button>
                    </div>
                  </div>
                )}
                {user &&
                  user.studyBlocks &&
                  (user?.studyBlocks?.length ?? 0) > 0 &&
                  user?.studyBlocks?.map((studyBlock) => {
                    const sbStart = new Date(studyBlock.startDate);
                    const sbEnd = new Date(studyBlock.endDate);
                    const dtf = new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    return (
                      <div key={studyBlock.id} className="mb-12">
                        <div className="flex">
                          <Heading size="lg">
                            {studyBlock.name}
                            <IconButton
                              onClick={() => {
                                setDeleteStudyBlock(studyBlock);
                              }}
                              className="ml-4"
                              icon={<DeleteIcon />}
                              size="xs"
                              aria-label={"Delete"}
                              colorScheme="teal"
                            />
                          </Heading>
                        </div>
                        <div className="text-md">
                          {dtf.format(sbStart)} &#8212; {dtf.format(sbEnd)}
                        </div>

                        {user.studyBlocks.length === 1 && studyBlock.subjects.length === 0 && (
                          <Box mt={4}>
                            <Alert>
                              <AlertIcon />
                              <AlertTitle>Great job!</AlertTitle>
                              <AlertDescription>Now, let&apos;s make a course in {studyBlock.name}.</AlertDescription>
                            </Alert>
                          </Box>
                        )}

                        {studyBlock.subjects.map((subject) => (
                          <CoursePill
                            key={subject.id}
                            onClick={() => {
                              router.push(`/blocks/${studyBlock.id}/courses/${subject.id}`);
                            }}
                            subject={subject}
                            gradeMap={user.gradeMap}
                          />
                        ))}

                        <Button onClick={() => setCourseCreateBlockId(studyBlock.id)} mt={4} colorScheme="teal" size="sm">
                          + New course in {studyBlock.name}
                        </Button>
                      </div>
                    );
                  })}
                {user?.studyBlocks && user?.studyBlocks.length > 0 && (
                  <Button colorScheme="orange" size="sm" onClick={createBlockDisclosure.onOpen}>
                    + New trimester/semester
                  </Button>
                )}
              </Skeleton>
            </div>
          </div>
        </>
      </div>
      <Box mx={12} mb={4} color={"GrayText"} fontSize={"sm"}>
        &copy; Animals With Cool Hats, Inc. <br />
        <Link href="/legal/privacy">Privacy</Link> &bull; <Link href="/legal/feedback">Feedback</Link> &bull;{" "}
        <Link href="/legal/donate">Donate</Link>
      </Box>
    </>
  );
};

const CreateBlockModal = (props: { isOpen: boolean; onClose: () => void }) => {
  return (
    <>
      <Modal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a new study block</ModalHeader>
          <ModalBody>
            <CreateBlock />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const CreateCourseModal = (props: { isOpen: boolean; onClose: () => void; blockId: string }) => {
  return (
    <>
      <Modal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a course</ModalHeader>
          <ModalBody>
            <CreateCourse block_id={props.blockId} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CourseList;
