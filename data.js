// 夢授業スライドのデフォルトデータ定義
window.YUME_DECKS = [
  {
    id: "career",
    title: "私のキャリアストーリー (講師自己紹介用)",
    description: "紙芝居風のイラストとストーリー形式で、高校生が感想を書きやすい問いかけを含んだ自己紹介スライドです。",
    slides: [
      {
        id: "car-1",
        layout: "title",
        title: "AIと創る未来の仕事",
        subtitle: "〜ドラえもんの「ひみつ道具」を自分で作る仕事？〜",
        content: {
          bgText: "AI TECH",
          caption: "AIエンジニア：赤堀 純一"
        },
        notes: "皆さん、こんにちは！今日は私のブースに来てくれてありがとうございます。私は『AI（人工知能）エンジニア』として、最先端の技術を使って便利な世の中を作る仕事をしています。今日は「AIエンジニアって何？どんな仕事なの？」という話を分かりやすくお伝えします。AIを「ドラえもんのひみつ道具」のように身近でワクワクする存在として捉えてみてください。"
      },
      {
        id: "car-2",
        layout: "kamishibai",
        title: "AIって何？未来のひみつ道具！",
        subtitle: "想像力を形にする魔法のツール",
        content: {
          image: "images/doraemon_ai.png",
          prompt: "A cute, friendly futuristic cat-like robot holding a glowing magical gadget",
          description: "私は「AIエンジニア」として、未来のひみつ道具を作る仕事をしています。\nAIは難しいプログラムではなく、私たちの「あったらいいな」を形にしてくれる魔法の粘土のようなものです。\n\n💬 感想のヒント：\n「もし自分がドラえもんのひみつ道具を一つ作れるとしたら、どんな道具がほしい？」"
        },
        notes: "私の自己紹介とAIの捉え方です。AIは人間のパートナーであり、未来の可能性を広げる道具です。皆さんの豊かな想像力こそが、新しいAIを生み出す源になります。（★トークのヒント：『さすがにどこでもドアは作れなくない？』と突っ込まれたら、『物理的な瞬間移動は難しくても、VRやAIを組み合わせて「一瞬で世界中のどこにでも行けるデジタルどこでもドア」なら作れるよね！スマホの自動翻訳（ほんやくコンニャク）はもう実現しているしね』と返すと盛り上がります）"
      },
      {
        id: "car-3",
        layout: "kamishibai",
        title: "AIエンジニアは『AIの家庭教師』",
        subtitle: "機械に優しく教えて育てる仕事",
        content: {
          image: "images/teacher_robot.png",
          prompt: "A friendly teacher-like programmer showing pictures of cats to a small cute friendly baby robot",
          description: "プログラマーの仕事は、一日中コードを黙々と書くだけではありません。\nAIに「これは猫だよ」「これは犬だよ」と教える、まるで『家庭教師』や『部活のコーチ』のようにAIを優しく育てる仕事です。\n\n💬 感想のヒント：\n「AIを育てる仕事が『学校の先生やコーチ』に似ていると聞いて、どう思いましたか？」"
        },
        notes: "具体的な仕事内容はAIの『教育』です。大量のデータを使ってAIを少しずつ賢くしていくプロセスは、人間が勉強して成長していく姿にとてもよく似ています。"
      },
      {
        id: "car-scratch",
        layout: "kamishibai",
        title: "みんなのノリで動かすプログラミング",
        subtitle: "Scratchで即興ライブコーディング！",
        content: {
          image: "images/scratch_kids.png",
          prompt: "Children looking at a colorful block programming screen (Scratch), eyes shining",
          description: "プログラミングは難しい暗記科目ではありません。\nみんなの「猫を速く走らせたい！」「宇宙に行かせたい！」というその場のアイデア（バイブス）に合わせて、ブロックを組み立てて動かすパズル遊びです。\n\n🔗 Scratch（スクラッチ）：https://scratch.mit.edu/\n\n💬 感想のヒント：\n「目の前でプログラムが組み立てられて動く実演を見て、イメージはどう変わりましたか？」"
        },
        notes: "ここからScratchの画面に切り替えて、生徒たちから意見をもらいながら即興でプログラムを作って見せるライブコーディングを行います。プログラミングの直感的で楽しい一面を感じてもらいます。"
      },
      {
        id: "car-4",
        layout: "kamishibai",
        title: "失敗するほど、AIは賢くなる！",
        subtitle: "エラーと戦うエンジニアの日常",
        content: {
          image: "images/success_robot.png",
          prompt: "A young developer programmer high-fiving a cute smiling robot assistant",
          description: "エンジニアの日常はエラー（バグ）との戦いです。\nしかし、エラーは失敗ではありません。何が違っていたかをAIと一緒に考えて解決するパズルのようなもの。クリアしたときの達成感は最高です！\n\n💬 感想のヒント：\n「『エラーやバグはAIが賢くなるチャンス』という前向きな考え方を聞いて、どう感じましたか？」"
        },
        notes: "数学やパズル、ものづくりが大好きな少年時代を経て、エラーと戦う楽しさを仕事にしました。失敗を恐れずに楽しむ姿勢が、エンジニアにとって一番大切な才能です。"
      },
      {
        id: "car-5",
        layout: "kamishibai",
        title: "君の『なぜ？』が未来を創る",
        subtitle: "AIを最強の相棒にして夢を叶えよう",
        content: {
          image: "images/future_dream.png",
          prompt: "A high school student standing next to a friendly floating robot, looking out at a futuristic city",
          description: "身の回りの「なぜ？」「もっとこうなれば便利なのに」というお困りごとや疑問こそが、新しいAIを生み出すタネです。\nAIを恐れるのではなく、最強の相棒にして自分のやりたい夢を広げていきましょう！\n\n💬 感想のヒント：\n「あなたの身の回りの『もっとこうなればいいのに』と思うお困りごとは何ですか？」"
        },
        notes: "高校生の皆さんへのメッセージです。AIの進化を心配するのではなく、使いこなして味方にしましょう。英語や数学の勉強も、実はAIという相棒と対話するための最強の道具になります。"
      },
      {
        id: "car-6",
        layout: "list",
        title: "感想シートに書いてみよう！",
        subtitle: "今日のお話の振り返り",
        content: {
          bullets: [
            "💡 印象に残ったこと： AIエンジニアのイメージ、Scratchの実演、バグへの考え方など、何でもOK！",
            "💡 考えてみよう： もしあなたがAIを一つ作れるなら、どんな「お助けAI」を作りたい？",
            "💡 未来への第一歩： 今日から意識してみたいことや、やってみたいことはありますか？"
          ]
        },
        notes: "生徒の皆さんが感想シートを書きやすいように、振り返りのヒントを画面に提示します。これらの質問のどれか一つについて書いてもらうよう促すと、感想がスムーズに書けます。"
      },
      {
        id: "car-thankyou",
        layout: "title",
        title: "ありがとうございました！",
        subtitle: "皆さんの未来を応援しています",
        content: {
          bgText: "THANK YOU",
          caption: "AIエンジニア：赤堀 純一"
        },
        notes: "ご清聴ありがとうございました。皆さんの未来の挑戦を、心から楽しみにしています！"
      }
    ]
  }
];
