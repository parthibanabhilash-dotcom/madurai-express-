export function AnimatedText({ text }: { text: string }) {
  return (
    <span data-text-reveal>
      {text.split(/(\s+)/).map((word, index) =>
        /\s+/.test(word) ? (
          word
        ) : (
          <span className="animated-word" key={index}>
            {word}
          </span>
        ),
      )}
    </span>
  );
}
