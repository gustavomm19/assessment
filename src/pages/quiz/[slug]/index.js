import { useState, useContext, useEffect, useRef } from "react";
import { StoreContext } from "@store/StoreProvider";
import { types } from "@store/reducer";
import { useRouter } from "next/router";
import styles from "@styles/Home.module.css";
import QuizCard from "src/components/quizCard";
import Head from "next/head";

const isBrowser = typeof window !== "undefined";

const QuizSlug = () => {
  const [store, dispatch] = useContext(StoreContext);
  const [quiz, setQuiz] = useState(null);
  const intervalRef = useRef(null);
  const router = useRouter();
  const { academy, slug } = router.query;

  useEffect(async () => {
    if (slug) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/assessment/${slug}`
      );

      const data = await res.json();
      setQuiz(data);

      if (isBrowser) {
        if (academy) localStorage.setItem("academy", academy);
        else localStorage.removeItem("academy");
      }

      const resThresh = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/assessment/${slug}/threshold${
          academy ? `?academy=${academy}` : ""
        }`
      );

      const dataThresh = await resThresh.json();

      const compare = (a, b) => {
        if (a.score_threshold < b.score_threshold) {
          return -1;
        }
        if (a.score_threshold > b.score_threshold) {
          return 1;
        }
        return 0;
      };

      const thres = dataThresh.sort(compare);

      dispatch({
        type: types.setTresholds,
        payload: thres,
      });

      dispatch({
        type: types.setQuesions,
        payload: data.questions,
      });

      dispatch({
        type: types.setIsInstantFeedback,
        payload: data.is_instant_feedback,
      });
    }
  }, [slug, academy]);

  const handleStartQuiz = () => {
    if (store.started) {
      dispatch({
        type: types.timerRef,
        payload: intervalRef.current,
      });
    } else {
      const currentTime = Date.now() - store.timer;
      store.timerRef = setInterval(() => {
        dispatch({
          type: types.startTimer,
          payload: Math.floor((Date.now() - currentTime) / 1000),
        });
      }, 1000);
      dispatch({ type: types.setStarted });
    }
  };

  if (!quiz) return (
    <div className={styles.container}>
      <div className={styles.quiz_main}>
        <h3 className={styles.quiz_title}>...Loading</h3>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <Head>
        <title>{quiz?.title}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {store.showFinalScore !== true && store.started === true ? (
        <p className={styles.currentQuestion} style={{ zIndex: -1 }}>
          {store.currentQuestion}/{store.questions.length}
        </p>
      ) : null}

      <p className={styles.quiz_timer} style={{ zIndex: 99 }}>
        {store.timer} sec
      </p>

      <div className={styles.quiz_main}>
        {!store.started ? (
          <>
            <h1 className={styles.quiz_title}>{quiz?.title}</h1>

            <div className={styles.grid_start}>
              <button className={styles.start} onClick={handleStartQuiz}>
                <h2 style={{ margin: "5px 0" }}>Start</h2>
              </button>
            </div>
          </>
        ) : (
          <QuizCard />
        )}
      </div>
    </div>
  );
};

export default QuizSlug;
