# Local development environment

ローカル開発の基本となる環境一式。

- nodenv
- EditorConfig
- ESLint (エディタ)
- StyleLint (エディタ)
のインストールを推奨。

## Node version
10.16.3

## Install
```
$ yarn install
```

## Development
```
$ yarn run dev
```

## Production
```
$ yarn run prod
```
- 画像を圧縮するので少し時間がかかる
- JS, CSSの.mapファイルは生成されない
- スタイルガイドは生成されない

## SVG Sprite
```
$ yarn run svg
```
