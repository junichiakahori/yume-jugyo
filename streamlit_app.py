import streamlit as st

# UIの設定（ダークモードを想定したモダンな設定）
st.set_page_config(page_title="夢授業 インタラクティブ・スライド (Streamlit)", layout="wide")

# スライドデータ（Pythonの辞書形式）
# セッション状態にスライドデータを保持することで、編集可能にします
if "decks" not in st.session_state:
    st.session_state.decks = {
        "career": {
            "title": "私のキャリアストーリー (講師自己紹介用)",
            "slides": [
                {
                    "title": "AIと創る未来の仕事",
                    "subtitle": "〜ドラえもんの「ひみつ道具」を自分で作る仕事？〜",
                    "content": "職業人：赤堀 純一\n\n最先端 of AI技術を使って、世界を少しずつ便利にする仕事をしています。",
                    "notes": "皆さん、こんにちは！今日は私のブースに来てくれてありがとうございます。私は『AI（人工知能）エンジニア』として、最先端の技術を使って便利な世の中を作る仕事をしています。今日は「AIエンジニアって何？どんな仕事なの？」という話を分かりやすくお伝えします。AIを「ドラえもんのひみつ道具」のように身近でワクワクする存在として捉えてみてください。"
                },
                {
                    "title": "AIって何？未来のひみつ道具！",
                    "subtitle": "想像力を形にする魔法のツール",
                    "content": "私は「AIエンジニア」として、未来のひみつ道具を作る仕事をしています。\nAIは難しいプログラムではなく、私たちの「あったらいいな」を形にしてくれる魔法の粘土のようなものです。\n\n💬 感想のヒント：\n「もし自分がドラえもんのひみつ道具を一つ作れるとしたら、どんな道具がほしい？」",
                    "notes": "私の自己紹介とAIの捉え方です。AIは人間のパートナーであり、未来の可能性を広げる道具です。皆さんの豊かな想像力こそが、新しいAIを生み出す源になります。"
                },
                {
                    "title": "AIエンジニアは『AIの家庭教師』",
                    "subtitle": "機械に優しく教えて育てる仕事",
                    "content": "プログラマーの仕事は、一日中コードを黙々と書くだけではありません。\nAIに「これは猫だよ」「これは犬だよ」と教える、まるで『家庭教師』や『部活のコーチ』のようにAIを優しく育てる仕事です。\n\n💬 感想のヒント：\n「AIを育てる仕事が『学校の先生やコーチ』に似ていると聞いて、どう思いましたか？」",
                    "notes": "具体的な仕事内容はAIの『教育』です。大量のデータを使ってAIを少しずつ賢くしていくプロセスは、人間が成長していく姿にとてもよく似ています。"
                },
                {
                    "title": "みんなのノリで動かすプログラミング",
                    "subtitle": "Scratchで即興ライブコーディング！",
                    "content": "プログラミングは難しい暗記科目ではありません。\nみんなの「猫を速く走らせたい！」「宇宙に行かせたい！」というその場のアイデアに合わせて、ブロックを組み立てて動かすパズル遊びです。\n\n🔗 Scratch（スクラッチ）：https://scratch.mit.edu/\n\n💬 感想のヒント：\n「目の前でプログラムが組み立てられて動く実演を見て、イメージはどう変わりましたか？」",
                    "notes": "ここからScratchの画面に切り替えて、生徒たちから意見をもらいながら即興でプログラムを作って見せるライブコーディングを行います。プログラミングの直感的で楽しい一面を感じてもらいます。"
                },
                {
                    "title": "失敗するほど、AIは賢くなる！",
                    "subtitle": "エラーと戦うエンジニアの日常",
                    "content": "エンジニアの日常はエラー（バグ）との戦いです。\nしかし、エラーは失敗ではありません。何が違っていたかをAIと一緒に考えて解決するパズルのようなもの。クリアしたときの達成感は最高です！\n\n💬 感想のヒント：\n「『エラーやバグはAIが賢くなるチャンス』という前向きな考え方を聞いて、どう感じましたか？」",
                    "notes": "数学やパズル、ものづくりが大好きな少年時代を経て、エラーと戦う楽しさを仕事にしました。失敗を恐れずに楽しむ姿勢が、エンジニアにとって一番大切な才能です。"
                },
                {
                    "title": "君の『なぜ？』が未来を創る",
                    "subtitle": "AIを最強の相棒にして夢を叶えよう",
                    "content": "身の回りの「なぜ？」「もっとこうなれば便利なのに」というお困りごとや疑問こそが、新しいAIを生み出すタネです。\nAIを恐れるのではなく、最強の相棒にして自分のやりたい夢を広げていきましょう！\n\n💬 感想のヒント：\n「あなたの身の回りの『もっとこうなればいいのに』と思うお困りごとは何ですか？」",
                    "notes": "高校生の皆さんへのメッセージです。AIの進化を心配するのではなく、使いこなして味方にしましょう。英語や数学の勉強も、実はAIという相棒と対話するための最強の道具になります。"
                },
                {
                    "title": "感想シートに書いてみよう！",
                    "subtitle": "今日のお話の振り返り",
                    "content": "💡 印象に残ったこと：\nAIエンジニアのイメージ、Scratchの実演、バグへの考え方など、何でもOK！\n\n💡 考えてみよう：\nもしあなたがAIを一つ作れるなら、どんな「お助けAI」を作りたい？\n\n💡 未来への第一歩：\n今日から意識してみたいことや、やってみたいことはありますか？",
                    "notes": "生徒の皆さんが感想シートを書きやすいように、振り返りのヒントを画面に提示します。これらの質問のどれか一つについて書いてもらうよう促すと、感想がスムーズに書けます。"
                },
                {
                    "title": "ありがとうございました！",
                    "subtitle": "皆さんの未来を応援しています",
                    "content": "ご清聴ありがとうございました。\n\n皆さんの未来の挑戦を、心から楽しみにしています！",
                    "notes": "ご清聴ありがとうございました。皆さんの未来の挑戦を、心から楽しみにしています！"
                }
            ]
        }
    }

# 選択しているデッキとスライド番号の管理
if "deck_id" not in st.session_state:
    st.session_state.deck_id = "career"
if "slide_index" not in st.session_state:
    st.session_state.slide_index = 0

# --- サイドバー表示 ---
st.sidebar.title("🤖 Streamlitデモアプリ")
st.sidebar.write("PythonのStreamlitで作成したスライドシステムです。")

# 現在のデータへの参照
deck = st.session_state.decks[st.session_state.deck_id]
slides = deck["slides"]

# 範囲外アクセス防止
if st.session_state.slide_index >= len(slides):
    st.session_state.slide_index = 0

current_slide = slides[st.session_state.slide_index]

# --- メイン画面表示 ---
# タイトル・サブタイトル
st.title(current_slide["title"])
if current_slide["subtitle"]:
    st.caption(current_slide["subtitle"])

# スライドのメイン領域（CSSによるカード装飾）
html_content = current_slide["content"].replace("\n", "<br>")
st.markdown(
    f"""
    <style>
    .slide-card-container {{
        background-color: #121216;
        padding: 40px;
        border-radius: 12px;
        border: 2px solid #bf5af2;
        min-height: 250px;
        margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(191, 90, 242, 0.1);
        font-size: 24px;
        line-height: 1.6;
    }}
    .slide-card-container, .slide-card-container * {{
        color: #f2f2f7 !important;
    }}
    </style>
    <div class="slide-card-container">{html_content}</div>
    """,
    unsafe_allow_html=True
)

# 操作ボタン用レイアウト
col_prev, col_num, col_next = st.columns([1, 1, 1])
with col_prev:
    if st.button("⬅️ 前へ", use_container_width=True) and st.session_state.slide_index > 0:
        st.session_state.slide_index -= 1
        st.rerun()

with col_num:
    st.markdown(
        f"<h4 style='text-align: center;'>{st.session_state.slide_index + 1} / {len(slides)}</h4>",
        unsafe_allow_html=True
    )

with col_next:
    if st.button("次へ ➡️", use_container_width=True) and st.session_state.slide_index < len(slides) - 1:
        st.session_state.slide_index += 1
        st.rerun()

# 発表者ノート表示
st.write("")
st.write("")
with st.expander("🗣️ 発表者ノート (メモ)", expanded=True):
    st.info(current_slide["notes"])

# --- サイドバーでのスライド編集エリア ---
st.sidebar.divider()
st.sidebar.subheader("✏️ スライドをその場で書き換える")
edited_title = st.sidebar.text_input("スライドタイトル", current_slide["title"])
edited_subtitle = st.sidebar.text_input("サブタイトル", current_slide["subtitle"])
edited_content = st.sidebar.text_area("本文", current_slide["content"], height=150)
edited_notes = st.sidebar.text_area("発表者ノート", current_slide["notes"], height=100)

# 編集の反映と再描画
if (edited_title != current_slide["title"] or 
    edited_subtitle != current_slide["subtitle"] or 
    edited_content != current_slide["content"] or 
    edited_notes != current_slide["notes"]):
    
    current_slide["title"] = edited_title
    current_slide["subtitle"] = edited_subtitle
    current_slide["content"] = edited_content
    current_slide["notes"] = edited_notes
    st.rerun()
