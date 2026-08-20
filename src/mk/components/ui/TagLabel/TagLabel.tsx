import styles from './TagLabel.module.css'

const TagLabel = (props:any) => {
  return (
    <div className={styles['TagLabel']} style={props.styles}>
     <div>{props.icon}</div><div>{props.label}</div>
    </div>
  )
}

export default TagLabel