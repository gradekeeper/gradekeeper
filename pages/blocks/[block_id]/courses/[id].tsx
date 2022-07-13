import { DeleteIcon, InfoOutlineIcon } from "@chakra-ui/icons";
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
  IconButton,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useClipboard,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { PropsWithChildren, useRef, useState } from "react";
import AveragesWidget from "../../../../components/app/courseView/AveragesWidget";
import ComponentEditModal from "../../../../components/app/courseView/ComponentEditModal";
import ComponentRow from "../../../../components/app/courseView/ComponentRow";
import CourseCompletedWidget from "../../../../components/app/courseView/CourseCompletedWidget";
import Footer from "../../../../components/app/Footer";
import { TopBar } from "../../../../components/app/TopBar";
import { GkEditable } from "../../../../components/generic/GkEditable";
import { FullSubjectComponent } from "../../../../lib/fullEntities";
import {
  adjust,
  calculateProjectedGradeForComponent,
  pickTextColorBasedOnBgColorAdvanced,
  ProcessedCourseInfo,
  ProcessedStudyBlock,
  _null,
} from "../../../../lib/logic";
import themeConstants from "../../../../lib/theme/themeConstants";
import { useUserContext } from "../../../../lib/UserContext";

const SubjectPage: NextPage = () => {
  const router = useRouter();
  const { block_id, id } = router.query;
  const user = useUserContext();
  const studyBlock = user.user?.processedStudyBlocks?.filter((e) => e.id === block_id)[0];
  const course0 = studyBlock?.processedCourses.filter((d) => d.id === id)[0];
  const subject = course0;
  if (!subject || !studyBlock) {
    return (
      <>
        <TopBar />
        <Center>
          <Spinner color="teal" />
        </Center>
      </>
    );
  } else return <Subject studyBlock={studyBlock} course={course0} key={id?.toString()} />;
};

const Subject = (
  props: PropsWithChildren<{
    course: ProcessedCourseInfo;
    studyBlock: ProcessedStudyBlock;
  }>
) => {
  const user = useUserContext();
  const router = useRouter();

  const studyBlock = props.studyBlock;
  const course = props.course;
  const id = props.course.id;
  const gradeMap = props.course.status.gradeMap;

  const cb = useClipboard(course.id?.toString() || "");
  const [component, setTargetComponent] = useState(_null<FullSubjectComponent>());
  const [deleting, isDeleting] = useState(false);
  const captionColor = useColorModeValue("gray.700", "gray.200");
  const disc = useDisclosure();
  const cancelref = useRef<any>();
  const toast = useToast();
  const [name, setName] = useState(course?.longName);
  const [sectionLoadingUpdate, setSectionLoadingUpdate] = useState("");
  return (
    <div>
      <Head>
        <title>{course?.longName ?? "Loading..."}</title>
      </Head>
      <TopBar currentSubjectId={id?.toString()} />
      {component !== null ? (
        <ComponentEditModal
          subject={course}
          blockId={course?.studyBlockId ?? ""}
          onReceiveUpdatedData={(newcomp) => {
            setTargetComponent(null);
          }}
          gradeMap={gradeMap}
          onClose={() => {
            setTargetComponent(null);
          }}
          showing={component !== null}
          component={component}
        />
      ) : (
        <></>
      )}
      <>
        <div style={{ backgroundColor: course?.color }} className="p-8">
          <div className="text-3xl" style={{ color: pickTextColorBasedOnBgColorAdvanced(course?.color ?? "", "white", "") }}>
            <span className="mr-4">
              {course?.courseCodeName} {course?.courseCodeNumber}
            </span>
            {sectionLoadingUpdate !== "longName" ? (
              <GkEditable
                onSubmit={async (v) => {
                  setSectionLoadingUpdate("longName");
                  const d = await fetch(`/api/block/${studyBlock.id.toString()}/course/${course?.id}`, {
                    body: JSON.stringify({ longName: v }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                    method: "POST",
                  });
                  if (d.ok) {
                    const newcourse = await d.json();
                    user.updateCourse(newcourse.id, newcourse);
                    setSectionLoadingUpdate("");
                  } else {
                  }
                }}
                inputProps={{ size: course?.longName.length, style: { display: "inline", color: "black" } }}
                displayProps={{ style: { display: "inline", fontWeight: "bold" } }}
                value={name}
                onChange={(e) => setName(e)}
              />
            ) : (
              <>
                <Spinner />
              </>
            )}
          </div>
          <div className="text-xl" style={{ color: "#DDDDDD" }}>
            <span className="mr-4">
              <span style={{ color: pickTextColorBasedOnBgColorAdvanced(course?.color, "white", "black") }}>
                <span>{studyBlock?.name}</span>
              </span>
              <IconButton
                onClick={() => {
                  disc.onOpen();
                }}
                className="ml-4"
                icon={<DeleteIcon />}
                size="xs"
                aria-label={"Delete"}
                colorScheme="teal"
              />
              <Button size="xs" ml={2} onClick={cb.onCopy} colorScheme="teal" disabled={cb.hasCopied}>
                {cb.hasCopied ? "Copied" : "Copy share code"}
              </Button>
            </span>
            <AlertDialog isOpen={disc.isOpen} leastDestructiveRef={cancelref} onClose={disc.onClose}>
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Delete course &lsquo;{course?.longName}&rsquo;
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    Are you <strong>sure</strong> you want to delete {course?.longName}? <br />
                    This will delete <strong>all</strong> results.
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <Button ref={cancelref} onClick={disc.onClose}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        isDeleting(true);
                        fetch(`/api/block/${course?.studyBlockId}/course/${course?.id}`, { method: "DELETE" }).then(() => {
                          isDeleting(false);
                          toast({
                            title: "Course deleted.",
                            description: course?.courseCodeName + " " + course?.courseCodeNumber + " deleted.",
                            duration: 4000,
                            isClosable: true,
                            status: "success",
                          });
                          router.push("/");
                          user.updateCourse(course?.id, undefined);
                        });
                      }}
                      isLoading={deleting}
                      ml={3}
                    >
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
          </div>
        </div>

        {course.status.isCompleted && (
          <div
            className="p-6 m-4 shadow-md rounded-md"
            style={{ backgroundColor: useColorModeValue("white", themeConstants.darkModeContrastingColor) }}
          >
            <CourseCompletedWidget course={course} />
          </div>
        )}

        <div className="flex flex-wrap">
          <div
            className="grow m-4 p-6 shadow-md rounded-md overflow-auto"
            style={{ backgroundColor: useColorModeValue("white", themeConstants.darkModeContrastingColor) }}
          >
            <div style={{ color: course?.color }} className="text-2xl mb-2 font-bold">
              Results
            </div>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th pl={0}>Name</Th>
                    <Th pl={0}>Weight</Th>
                    <Th pl={0}>Score</Th>
                    <Th pl={0}>Grade</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {course?.components?.map((e, i) => {
                    console.log(e);
                    const grade = calculateProjectedGradeForComponent(e);
                    return (
                      <ComponentRow
                        onRequestModalOpen={() => {
                          setTargetComponent(e);
                        }}
                        subject={course}
                        key={e.id}
                        component={e}
                        componentGrade={grade}
                      />
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </div>

          {!course.status.isCompleted && <AveragesWidget course={course} />}
        </div>

        {!course.status.isCompleted && (
          <div
            className="p-6 m-4 shadow-md rounded-md"
            style={{ backgroundColor: useColorModeValue("white", themeConstants.darkModeContrastingColor) }}
          >
            <div className="">
              <>
                <div className="lg:flex">
                  <Stat className="basis-1/4" style={{ WebkitFlex: "0 !important" }}>
                    <StatLabel fontSize="lg">Projected grade</StatLabel>
                    <StatNumber>{props.course.grades.projected?.letter}</StatNumber>
                    <StatHelpText>{((props.course.grades.projected?.numerical ?? 0) * 100).toPrecision(4)}%</StatHelpText>
                  </Stat>
                  <div className="py-3 flex grow mb-6">
                    <div style={{ position: "relative", backgroundColor: "#D9D9D9", height: "30px" }} className="rounded flex grow">
                      <div
                        style={{
                          position: "absolute",
                          height: "30px",
                          background: `repeating-linear-gradient(45deg, ${adjust(course?.color ?? "", -20)}, ${adjust(
                            course?.color ?? "",
                            -20
                          )} 10px, ${adjust(course?.color ?? "", -40)} 10px, ${adjust(course?.color ?? "", -40)} 20px)`,
                          width: props.course.grades.actual?.numerical * 100 + "%",
                        }}
                        className="rounded"
                      >
                        &nbsp;
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          height: "30px",
                          background: `repeating-linear-gradient(45deg,grey, grey 10px, white 10px, white 20px)`,
                          right: "0px",
                          width: 100 - props.course.grades.maximumPossible?.numerical * 100 + "%",
                        }}
                        className="rounded"
                      >
                        &nbsp;
                      </div>
                      <div
                        style={{
                          backgroundColor: course?.color ?? "",
                          width: "" + props.course.grades.projected?.numerical * 100 + "%",
                        }}
                        className="rounded"
                      >
                        &nbsp;
                      </div>
                      {Object.keys(gradeMap ?? {})
                        .map((e) => Number.parseFloat(e))
                        .map((gradeNumber) => (
                          <ProgressBarAmendment
                            key={gradeNumber}
                            color={adjust(course?.color ?? "", -50)}
                            atProgressPercentage={gradeNumber * 100}
                            position="bottom"
                          >
                            <Text color={captionColor}>
                              {(gradeNumber * 100).toFixed(0)} <br />
                              {(gradeMap ?? {})[gradeNumber]}
                            </Text>
                          </ProgressBarAmendment>
                        ))}
                      <ProgressBarAmendment
                        color={adjust(course?.color ?? "", -40)}
                        atProgressPercentage={props.course.grades.actual?.numerical * 100}
                        position="top"
                      >
                        <Tooltip
                          label={
                            "Lowest possible grade: " +
                            props.course.grades.actual?.letter +
                            " (" +
                            (props.course.grades.actual?.numerical * 100).toPrecision(3) +
                            "%)"
                          }
                        >
                          <InfoOutlineIcon w={4} h={4} />
                        </Tooltip>
                      </ProgressBarAmendment>
                      <ProgressBarAmendment
                        color={"grey"}
                        atProgressPercentage={props.course.grades.maximumPossible?.numerical * 100}
                        position="top"
                      >
                        <Tooltip
                          label={
                            "Maximum possible grade: " +
                            props.course.grades.maximumPossible?.letter +
                            " (" +
                            (props.course.grades.maximumPossible?.numerical * 100).toPrecision(3) +
                            "%)"
                          }
                        >
                          <InfoOutlineIcon w={4} h={4} />
                        </Tooltip>
                      </ProgressBarAmendment>
                    </div>
                  </div>
                </div>
              </>
            </div>
          </div>
        )}
        <Box px={8} py={2}>
          <Footer />
        </Box>
      </>
    </div>
  );
};

const ProgressBarAmendment = (props: PropsWithChildren<{ color: string; atProgressPercentage: number; position: "top" | "bottom" }>) => {
  const topStyling: any = {};
  if (props.position === "top") topStyling.bottom = "120%";
  if (props.position === "bottom") topStyling.top = "110%";
  return (
    <>
      <div
        style={{
          borderColor: props.color,
          position: "absolute",
          height: "99%",
          width: "1px",
          left: props.atProgressPercentage + "%",
        }}
        className="border border-black"
      >
        &nbsp;
      </div>
      <Text
        style={{
          position: "absolute",
          left: props.atProgressPercentage - 1 + "%",
          ...topStyling,
        }}
        className="text-xs md:text-base text-center"
        fontWeight={"semibold"}
      >
        {props.children}
      </Text>
    </>
  );
};

export default SubjectPage;
