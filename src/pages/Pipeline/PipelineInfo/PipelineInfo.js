/**
 *  流水线信息展示，修改
 *  @author zhangfuli
 *
 * */

import React, {Component} from 'react';
import {FormBinderWrapper, FormBinder, FormError} from '@icedesign/form-binder';
import {Input, Button, Select, Dialog} from '@icedesign/base';
import {Link} from 'react-router-dom';
import Jenkinsfile from '../components/Jenkinsfile'
import PipelineInfoStage from '../components/PipelineInfoStage'
import './PipelineInfo.scss';
import Axios from 'axios';
import API from '../../API';
import {Feedback} from "@icedesign/base/index";
import {injectIntl} from "react-intl";

const {Combobox} = Select;
const {toast} = Feedback;

class PipelineInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // 流水线的基本信息
            pipeline: {
                name: "",
                //监听设置
                monitor: 1,
                timing: null,
                appId: null,
                appEnvId: null,
                config: 1,
                stages: [],
                jenkinsfile: {}
            },
            monitor: [
                this.props.intl.messages["pipeline.info.monitor.auto"],
                this.props.intl.messages["pipeline.info.monitor.manual"],
                this.props.intl.messages["pipeline.info.monitor.timing"],
            ],
            jenkinsFile: [
                this.props.intl.messages["pipeline.info.hasJenkinsfile"],
                this.props.intl.messages["pipeline.info.noJenkinsfile"]
            ],
            // timing: [
            //     this.props.intl.messages["pipeline.info.monitor.timing.10"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.20"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.30"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.60"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.120"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.240"],
            //     this.props.intl.messages["pipeline.info.monitor.timing.360"]
            // ],
            timing: "H/15 * * * *",
            haveJenkinsFile: null,
            jenkinsFileInfo: {
                git: "",
                path: "./Jenkinsfile"
            },
            currentStage: 0,
            applications: [],
            dockerUserName: null,
            repository: null
        };
    }

    componentWillMount() {
        this.getApplication()
    }

    getApplication() {
        let url = API.application + "/app?ouser=" + window.sessionStorage.getItem('user-id');
        let self = this;
        let applications = self.state.applications;
        Axios.get(url).then((response) => {
            if (response.status === 200) {
                for (let i = 0; i < response.data.length; i++) {
                    let application = {
                        label: response.data[i].title,
                        value: response.data[i].id
                    };
                    applications.push(application)
                }
                self.setState({
                    applications: applications
                })
            }
        })
    }

    /**
     *  基本信息
     * */
    formChange = value => {
        this.setState({value});
    };

    /**
     * 选择监听方式更新数据
     * */
    selectMonitor(value) {
        let pipeline = Object.assign({}, this.state.pipeline, {monitor: this.state.monitor.indexOf(value)});
        this.setState({
            pipeline: pipeline
        })
    }

    selectTiming(value) {
        let pipeline = Object.assign({}, this.state.pipeline, {timing: this.state.timing.indexOf(value)});
        this.setState({
            pipeline: pipeline
        });
    }

    selectApplication(value) {
        let pipeline = this.state.pipeline;
        pipeline.appId = value;
        this.setState({
            pipeline
        });
    }


    selectJenkinsFile(value) {
        let pipeline = Object.assign({}, this.state.pipeline, {config: this.state.jenkinsFile.indexOf(value)});
        this.setState({
            haveJenkinsFile: this.state.jenkinsFile.indexOf(value),
            pipeline: pipeline
        })
    }

    jenkinsFileData(jenkinsFileInfo) {
        this.setState({
            jenkinsFileInfo
        });
    }

    setStages(value, currentStage) {
        let pipeline = Object.assign({}, this.state.pipeline, {stages: value});
        this.setState({
            pipeline: pipeline,
            currentStage: currentStage
        })
    }
    onChangeApp(value){
        let pipeline = this.state.pipeline;
        pipeline.appId = value;
        this.setState({
            pipeline
        })
    }
    onSelectEnv(value) {
        let pipeline = this.state.pipeline;
        pipeline.appEnvId = value;
        this.setState({
            pipeline
        })
    }
    onChangeDockerUserName(value){
        this.setStages({
            dockerUserName: value
        })
    }
    onChangeRepository(value){
        this.setStages({
            repository: value
        })
    }

    copy(data){
        const input = document.createElement('input')
        document.body.appendChild(input);
        input.setAttribute('value', API.pipeline + '/v1/jenkins/build/' + data);
        input.select();
        try{
            if(document.execCommand("copy","false",null)){
                toast.show({
                    type: "success",
                    content: "复制成功",
                    duration: 1000
                });
            }else{
                toast.show({
                    type: "error",
                    content: "复制失败请手动复制",
                    duration: 1000
                });
            }
        }catch(err){
            toast.show({
                type: "error",
                content: "复制失败请手动复制",
                duration: 1000
            });
        }
        document.body.removeChild(input)
    }

    onCancel(){
        toast.show({
            type: "error",
            content: "不进行设置将不会进行自动触发",
            duration: 1000
        });
    }

    saveJenkinsfile() {
        let pipeline = this.state.pipeline;
        let jenkinsFileInfo = this.state.jenkinsFileInfo;
        let self = this;
        pipeline.jenkinsfile = jenkinsFileInfo;
        let url = API.pipeline + "/v1/pipeline/jenkinsfile";
        Axios.post(url, pipeline).then((response) => {
            if (response.status === 200) {
                toast.show({
                    type: "success",
                    content: "保存成功",
                    duration: 1000
                });
                if (self.state.pipeline.monitor === 0) {
                    Dialog.confirm({
                        language: window.sessionStorage.getItem('language').toLocaleLowerCase(),
                        content: <div>
                            <p>请复制以下链接到webhook: </p>
                            <p>{API.pipeline + "/v1/jenkins/build/" + response.data}</p>
                        </div>,
                        title: "提示",
                        onOk: self.copy.bind(this, response.data),
                        onCancel: self.onCancel.bind(this)
                    });
                }
                self.props.history.push('/pipeline')
            }
        }).catch(() => {
            toast.show({
                type: "error",
                content: "请检查您的路径",
                duration: 1000
            });
        })
    }

    saveNoJenkinsfile() {
        let self = this;
        let url = API.pipeline + '/v1/pipeline';
        toast.show({
            type: "loading",
            content: self.props.intl.messages["pipeline.info.submitting"],
            duration: 4000
        });
        console.log(self.state.pipeline);
        Axios({
            method: 'post',
            url: url,
            data: self.state.pipeline
        }).then((response) => {
            if (response.status === 200) {
                toast.show({
                    type: "success",
                    content: self.props.intl.messages["pipeline.info.saveSuccess"],
                    duration: 1000
                });

                if (self.state.pipeline.monitor === 0) {
                    Dialog.confirm({
                        language: window.sessionStorage.getItem('language').toLocaleLowerCase(),
                        content: <div>
                            <p>请复制以下链接到webhook: </p>
                            <p>{API.pipeline + "/v1/jenkins/build/" + response.data}</p>
                        </div>,
                        title: "提示",
                        onOk: self.copy.bind(this, response.data),
                        onCancel: self.onCancel.bind(this)
                    });
                }
                self.props.history.push('/pipeline')
            }
        }).catch((error) => {
            toast.show({
                type: "error",
                content: self.props.intl.messages["pipeline.info.saveFailure"],
                duration: 1000
            });
        })
    }

    render() {
        return (
            <div className="pipeline-info-body">
                <FormBinderWrapper
                    value={this.state.pipeline}
                    onChange={this.formChange}
                    ref="form"
                >
                    <div className="form-body">
                        <div className="form-item">
                            <span className="form-item-label">{this.props.intl.messages["pipeline.info.name"]}: </span>
                            <FormBinder name="name" required
                                        message={this.props.intl.messages["pipeline.info.name.placeholder"]}>
                                <Input placeholder={this.props.intl.messages["pipeline.info.name.placeholder"]}
                                       className="combobox"/>
                            </FormBinder>
                            <FormError className="form-item-error" name="name"/>
                        </div>
                        <div className="form-item">
                            <span
                                className="form-item-label">{this.props.intl.messages["pipeline.info.monitor"]}: </span>
                            <FormBinder
                                name={this.state.monitor[this.state.pipeline.monitor]}
                                required
                                message={this.props.intl.messages["pipeline.info.monitor.placeholder"]}>
                                <Combobox
                                    onChange={this.selectMonitor.bind(this)}
                                    dataSource={this.state.monitor}
                                    placeholder={this.state.monitor[this.state.pipeline.monitor]}
                                    className="combobox"
                                >
                                </Combobox>
                            </FormBinder>
                            <FormError
                                className="form-item-error"
                                name={this.state.monitor[this.state.pipeline.monitor]}
                            />

                            {(() => {
                                if (this.state.pipeline.monitor === 0) {
                                    return <div className="form-item-tip">注意: 只有当代码库push代码才会触发</div>
                                } else if (this.state.pipeline.monitor === 2) {
                                    return (
                                        <div className="form-item-tip">
                                            <Input
                                                key="timing"
                                                onChange={this.selectTiming.bind(this)}
                                                value={this.state.timing}
                                                placeholder="定时触发间隔时长"
                                            >
                                            </Input>
                                        </div>
                                    )
                                }
                            })()}
                        </div>
                        <div className="form-item">
                            <span
                                className="form-item-label">{this.props.intl.messages["pipeline.info.jenkinsfile"]}: </span>
                            <FormBinder
                                name={this.state.jenkinsFile[this.state.pipeline.config]}
                                required
                                message={this.props.intl.messages["pipeline.info.jenkinsfile"]}>
                                <Combobox
                                    onChange={this.selectJenkinsFile.bind(this)}
                                    dataSource={this.state.jenkinsFile}
                                    placeholder={this.state.jenkinsFile[this.state.pipeline.config]}
                                    className="combobox"
                                >
                                </Combobox>
                            </FormBinder>
                            <FormError
                                className="form-item-error"
                                name={this.state.jenkinsFile[this.state.pipeline.config]}
                            />
                        </div>

                        {(() => {
                            if (this.state.haveJenkinsFile === 0) {
                                return (
                                    <Jenkinsfile
                                        jenkinsfile={this.state.jenkinsFileInfo}
                                        onChange={this.jenkinsFileData.bind(this)}
                                    />
                                )
                            } else {
                                return (
                                    <PipelineInfoStage
                                        stages={this.state.pipeline.stages}
                                        appId={this.state.pipeline.appId}
                                        appEnvId={this.state.pipeline.appEnvId}
                                        dockerUserName={this.state.dockerUserName}
                                        repository={this.state.repository}

                                        onChange={this.setStages.bind(this)}
                                        onChangeApp={this.onChangeApp.bind(this)}
                                        onSelectEnv={this.onSelectEnv.bind(this)}
                                        onChangeDockerUserName={this.onChangeDockerUserName.bind(this)}
                                        onChangeRepository={this.onChangeRepository.bind(this)}
                                    />
                                )
                            }
                        })()}


                    </div>
                </FormBinderWrapper>


                <div className="footer">
                    <div className="footer-container">
                        <Button
                            type="primary"
                            className="button"
                            onClick={
                                this.state.haveJenkinsFile === 0 ?
                                    this.saveJenkinsfile.bind(this) :
                                    this.saveNoJenkinsfile.bind(this)
                            }
                        >
                            {this.props.intl.messages["pipeline.info.save"]}
                        </Button>
                        <Link to='/pipeline'>
                            <Button
                                type="normal"
                                className="button"
                            >
                                {this.props.intl.messages["pipeline.info.cancel"]}
                            </Button>
                        </Link>

                    </div>
                </div>
            </div>
        );
    }
}

export default injectIntl(PipelineInfo)
