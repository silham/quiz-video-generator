import "./index.css";
import { Composition } from "remotion";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import {
  BubbleBackgroundComposition,
  bubbleBackgroundSchema,
} from "./BubbleBackgroundComposition";
import { ShortsQuizQuestion, shortsSchema } from "./Quiz/ShortsQuizQuestion";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={myCompSchema}
        defaultProps={{
          questionNumber: 1,
          questionText: "What is the outer layer of a tooth called? What is the outer layer of a tooth called? What is the outer layer of a tooth called?",
          questionImageSrc: "1040-500x500.jpg",
          answerImageSrc: "290-500x500.jpg",
          answer: "Enamel",
          questionAudioSrc: "question1.wav",
          answerAudioSrc: "answer1.wav",
          bgColor: "#91dAE2",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />

      <Composition
        id="BubbleBackground"
        component={BubbleBackgroundComposition}
        durationInFrames={1800} // 60 seconds * 30 fps = 1800 frames
        fps={30}
        width={1920}
        height={1080}
        schema={bubbleBackgroundSchema}
        defaultProps={{
          bubbleCount: 40,
          bgColor: "#239df3",
        }}
      />

      <Composition
        id="ShortsQuiz"
        component={ShortsQuizQuestion}
        durationInFrames={300} // 10 seconds * 30 fps
        fps={30}
        width={1080}
        height={1920}
        schema={shortsSchema}
        defaultProps={{
          questionNumber: 1,
          questionText: "What is the capital of France?",
          questionImageSrc: "1040-500x500.jpg",
          answerImageSrc: "290-500x500.jpg",
          answer: "Paris",
          questionAudioSrc: "question1.wav",
          answerAudioSrc: "answer1.wav",
          bgColor: "#91dAE2",
        }}
      />
    </>
  );
};
