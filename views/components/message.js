export default function MessageCluster({ get }) {
  const { me, content } = get();
  return <div class={`"message ${me ? "me" : "not-me"}"`}>
    <p class="content">{ content }</p>
  </div>
}