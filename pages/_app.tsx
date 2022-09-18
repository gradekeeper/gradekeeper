import { SlideFade } from "@chakra-ui/react";
import { Prisma } from "@prisma/client";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { processCourseInfo, ProcessedUserInfo, processStudyBlock, _undefined } from "../lib/logic/processing";
import { Chakra } from "../lib/theme/Chakra";
import { AppContext, UserContext } from "../lib/UserContext";
import "../styles/globals.css";
import { getUserQuery } from "./api/user";

function MyApp({ Component, pageProps: { session, ...pageProps }, router }: AppProps) {
  const [user, setUser] = useState(_undefined<ProcessedUserInfo>());
  const contextValue: AppContext = {
    user: user,
    setUser: setUser,
    redownload: async () => {
      async function download() {
        try {
          const d = await fetch("/api/user");
          const e = await d.json();
          const prismaResponse: Prisma.UserGetPayload<typeof getUserQuery> = e;
          const newUserInfo = {
            ...prismaResponse,
            processedStudyBlocks: prismaResponse.studyBlocks.map((rawStudyBlock) =>
              processStudyBlock(rawStudyBlock, prismaResponse.gradeMap)
            ),
          };
          console.log("User information: ", newUserInfo);
          setUser(newUserInfo);
        } catch (e) {
          await new Promise((r) => setTimeout(r, 200));
          console.error("Failed to download user data: ", e);
          await download();
        }
      }
      await download();
    },
    updateCourse: (courseId, replacementCourse) => {
      setUser({
        ...user,
        gradeMap: user?.gradeMap ?? {},
        processedStudyBlocks:
          user?.processedStudyBlocks.map((sb) => {
            if (!replacementCourse) {
              if (sb.processedCourses.filter((d) => d.id === courseId).length > 0) {
                return {
                  ...sb,
                  processedCourses: sb.processedCourses.filter((subj) => subj.id !== courseId),
                };
              }
              return sb;
            } else {
              if (sb.id === replacementCourse.studyBlockId) {
                if (sb.processedCourses.filter((aa) => aa.id === courseId).length === 0) {
                  sb.processedCourses.push(processCourseInfo(replacementCourse, user?.gradeMap as {}));
                  return sb;
                }
                return {
                  ...sb,
                  processedCourses: sb.processedCourses.map((subj) => {
                    if (subj.id === replacementCourse.id) return processCourseInfo(replacementCourse, user?.gradeMap as {});
                    return subj;
                  }),
                };
              }
              return sb;
            }
          }) ?? [],
      });
    },
  };
  useEffect(() => {
    contextValue.redownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <SessionProvider session={session}>
        <Chakra cookies={pageProps.cookies}>
          <UserContext.Provider value={contextValue}>
            <SlideFade key={router.route} in={true}>
              <Component {...pageProps} />
            </SlideFade>
          </UserContext.Provider>
        </Chakra>
      </SessionProvider>
    </>
  );
}

export default MyApp;
